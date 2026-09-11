/* ==========================================================================
   Japan 2026 - media pipeline
   --------------------------------------------------------------------------
   Everything that happens to a photo between the phone and the database.

   Why compress in the browser at all: a 4MB phone photo becomes about 400KB
   at 2000px, plus a 40KB thumbnail. Across roughly 1,400 photos that is the
   difference between comfortably inside the storage budget and well past it.

   Videos never come through here. They go up from the YouTube app as Unlisted
   and the admin pastes the link.
   ========================================================================== */

import { IMAGE } from "./config.js";
import { getClient } from "./supabase.js";

/* ------------------------------------------------------------ EXIF reader */
/* iPhone photos (JPEG and HEIC) put GPS in an Exif TIFF block, sometimes
   after XMP, sometimes inside the HEIC container. Walking JPEG APP1 markers
   misses that, so we search for the Exif header anywhere in the first megabyte. */

function findExifTiff(buffer) {
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i <= bytes.length - 8; i += 1) {
    if (
      bytes[i] === 0x45 &&
      bytes[i + 1] === 0x78 &&
      bytes[i + 2] === 0x69 &&
      bytes[i + 3] === 0x66 &&
      bytes[i + 4] === 0x00 &&
      bytes[i + 5] === 0x00
    ) {
      return i + 6;
    }
  }
  return -1;
}

function readTiffGps(view, tiff) {
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (p) => view.getUint16(p, little);
  const u32 = (p) => view.getUint32(p, little);

  const entries = (ifd) => {
    if (ifd < 0 || ifd + 2 > view.byteLength) return {};
    const found = {};
    const count = u16(ifd);
    for (let i = 0; i < count; i += 1) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      found[u16(entry)] = {
        type: u16(entry + 2),
        count: u32(entry + 4),
        value: entry + 8,
      };
    }
    return found;
  };

  const ascii = (tag) => {
    if (!tag) return null;
    const start = tag.count > 4 ? tiff + u32(tag.value) : tag.value;
    let out = "";
    for (let i = 0; i < tag.count - 1 && start + i < view.byteLength; i += 1) {
      const code = view.getUint8(start + i);
      if (!code) break;
      out += String.fromCharCode(code);
    }
    return out;
  };

  const gpsRef = (tag) => {
    if (!tag) return "";
    const start = tag.count > 4 ? tiff + u32(tag.value) : tag.value;
    if (start >= view.byteLength) return "";
    return String.fromCharCode(view.getUint8(start));
  };

  const rationals = (tag) => {
    if (!tag) return null;
    const start = tiff + u32(tag.value);
    const out = [];
    for (let i = 0; i < tag.count; i += 1) {
      const at = start + i * 8;
      if (at + 8 > view.byteLength) break;
      const num = u32(at);
      const den = u32(at + 4);
      out.push(den ? num / den : 0);
    }
    return out;
  };

  const ifd0 = entries(tiff + u32(tiff + 4));
  const result = {};

  if (ifd0[0x8769]) {
    const exif = entries(tiff + u32(ifd0[0x8769].value));
    const taken = ascii(exif[0x9003]) || ascii(exif[0x9004]);
    if (taken) {
      // EXIF writes "2026:09:18 14:23:05". Keep it as local wall-clock time.
      const [date, clock] = taken.split(" ");
      if (date && clock) result.takenAt = `${date.replace(/:/g, "-")}T${clock}`;
    }
  }

  if (ifd0[0x8825]) {
    const gps = entries(tiff + u32(ifd0[0x8825].value));
    const lat = rationals(gps[0x0002]);
    const lng = rationals(gps[0x0004]);
    const latRef = gpsRef(gps[0x0001]) || ascii(gps[0x0001]) || "N";
    const lngRef = gpsRef(gps[0x0003]) || ascii(gps[0x0003]) || "E";
    const toDegrees = (parts) =>
      parts && parts.length ? parts[0] + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600 : null;
    if (lat && lng) {
      result.lat = toDegrees(lat) * (latRef === "S" ? -1 : 1);
      result.lng = toDegrees(lng) * (lngRef === "W" ? -1 : 1);
    }
  }

  return result;
}

function gpsFromXmp(buffer) {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const parse = (raw) => {
    if (!raw) return null;
    const compact = raw.trim();
    const decimal = Number(compact);
    if (Number.isFinite(decimal) && Math.abs(decimal) <= 180) return decimal;
    const match = compact.match(/^(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*([NSEW])?$/i);
    if (!match) return null;
    const deg = Number(match[1]) + Number(match[2]) / 60 + Number(match[3] || 0) / 3600;
    const ref = (match[4] || "").toUpperCase();
    return deg * (ref === "S" || ref === "W" ? -1 : 1);
  };
  const lat = parse((text.match(/GPSLatitude(?:>|=")([^<"]+)/i) || [])[1]);
  const lng = parse((text.match(/GPSLongitude(?:>|=")([^<"]+)/i) || [])[1]);
  if (lat == null || lng == null) return {};
  return { lat, lng };
}

function readExif(buffer) {
  const view = new DataView(buffer);
  const tiff = findExifTiff(buffer);
  const fromTiff = tiff >= 0 ? readTiffGps(view, tiff) : {};
  if (fromTiff.lat != null && fromTiff.lng != null) return fromTiff;
  return { ...gpsFromXmp(buffer), ...fromTiff };
}

export async function exifOf(file) {
  try {
    // HEIC keeps Exif further in than a JPEG APP1 block.
    const head = await file.slice(0, 1048576).arrayBuffer();
    const meta = readExif(head);
    if (meta.lat != null && Number.isFinite(meta.lat)) return meta;
    if (file.size > 1048576) {
      const rest = await file.slice(1048576, Math.min(file.size, 2097152)).arrayBuffer();
      return { ...readExif(rest), ...meta };
    }
    return meta;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------- resampling */

async function toBitmap(file) {
  // imageOrientation "from-image" applies EXIF rotation so portraits stay upright.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const heic = /\.hei[cf]$/i.test(file.name || "") || /^image\/hei[cf]$/.test(file.type || "");
    if (heic) {
      throw new Error("Chrome cannot read HEIC. Export the picture as JPEG from Photos first.");
    }
    try {
      return await createImageBitmap(file);
    } catch {
      throw new Error("This file is not a photo Chrome can read.");
    }
  }
}

function scaleTo(width, height, maxEdge) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

async function encode(bitmap, maxEdge, quality) {
  const size = scaleTo(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("This photo could not be turned into a JPEG.");
  return { blob, ...size };
}

/** Turn one picked file into a full-size JPEG, a thumbnail and its metadata. */
export async function prepareImage(file) {
  const [meta, bitmap] = await Promise.all([exifOf(file), toBitmap(file)]);

  const full = await encode(bitmap, IMAGE.fullMaxEdge, IMAGE.fullQuality);
  const thumb = await encode(bitmap, IMAGE.thumbMaxEdge, IMAGE.thumbQuality);
  bitmap.close?.();

  return {
    full: full.blob,
    thumb: thumb.blob,
    width: full.width,
    height: full.height,
    bytes: full.blob.size,
    takenAt: meta.takenAt || null,
    lat: meta.lat ?? null,
    lng: meta.lng ?? null,
    originalName: file.name,
  };
}

/* ----------------------------------------------------------------- upload */

function safeName(name) {
  return name.replace(/[^\w.-]+/g, "-").toLowerCase();
}

/**
 * Upload one prepared image and create its media row.
 * Both objects share a path, so the thumbnail for photos/x.jpg is thumbs/x.jpg.
 */
export async function uploadImage(prepared, { dayId, dayDate, category, caption, place, mealId }) {
  const supabase = await getClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const stamp = Date.now();
  const path = `${dayDate || "unsorted"}/${stamp}-${safeName(prepared.originalName)}.jpg`;

  const options = { contentType: "image/jpeg", upsert: false, cacheControl: "31536000" };

  const [fullResult, thumbResult] = await Promise.all([
    supabase.storage.from("photos").upload(path, prepared.full, options),
    supabase.storage.from("thumbs").upload(path, prepared.thumb, options),
  ]);

  if (fullResult.error) throw fullResult.error;
  if (thumbResult.error) throw thumbResult.error;

  const takenMs = prepared.takenAt ? Date.parse(prepared.takenAt) : NaN;
  const { error } = await supabase.from("media").insert({
    day_id: dayId,
    meal_id: mealId || null,
    category: category || (mealId ? "food" : "place"),
    provider: "supabase",
    storage_path: path,
    thumb_path: path,
    width: prepared.width,
    height: prepared.height,
    bytes: prepared.bytes,
    taken_at: Number.isFinite(takenMs) ? new Date(takenMs).toISOString() : null,
    lat: Number.isFinite(prepared.lat) ? prepared.lat : null,
    lng: Number.isFinite(prepared.lng) ? prepared.lng : null,
    place: place || null,
    caption: caption || null,
  });
  if (error) throw error;

  return path;
}

/**
 * Group photos taken within half an hour of each other.
 * Twelve photos of one dinner become a single candidate meal to confirm,
 * which is the difference between logging food and not bothering.
 */
export function clusterByTime(items, gapMinutes = 30) {
  const withTime = items
    .filter((i) => i.taken_at || i.takenAt)
    .sort((a, b) => new Date(a.taken_at || a.takenAt) - new Date(b.taken_at || b.takenAt));

  const clusters = [];
  for (const item of withTime) {
    const at = new Date(item.taken_at || item.takenAt);
    const last = clusters[clusters.length - 1];
    if (last && (at - last.end) / 60000 <= gapMinutes) {
      last.items.push(item);
      last.end = at;
    } else {
      clusters.push({ start: at, end: at, items: [item] });
    }
  }
  return clusters;
}
