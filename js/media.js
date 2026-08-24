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
/* Just enough of the spec to pull out when a photo was taken and where.
   No dependency, about a hundred lines. GPS is what pins photos on the map;
   note the Pocket 3 has no GPS, so its clips fall back to the day's city. */

function readExif(buffer) {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xffd8) return {}; // not a JPEG

  let offset = 2;
  while (offset < view.byteLength - 4) {
    if (view.getUint16(offset) !== 0xffe1) {
      const size = view.getUint16(offset + 2);
      offset += 2 + size;
      continue;
    }
    const tiff = offset + 10;
    if (view.getUint32(offset + 4) !== 0x45786966) return {};

    const little = view.getUint16(tiff) === 0x4949;
    const u16 = (p) => view.getUint16(p, little);
    const u32 = (p) => view.getUint32(p, little);

    const entries = (ifd) => {
      const found = {};
      const count = u16(ifd);
      for (let i = 0; i < count; i += 1) {
        const entry = ifd + 2 + i * 12;
        found[u16(entry)] = { type: u16(entry + 2), count: u32(entry + 4), value: entry + 8 };
      }
      return found;
    };

    const ascii = (tag) => {
      if (!tag) return null;
      const start = tag.count > 4 ? tiff + u32(tag.value) : tag.value;
      let out = "";
      for (let i = 0; i < tag.count - 1; i += 1) {
        out += String.fromCharCode(view.getUint8(start + i));
      }
      return out;
    };

    const rationals = (tag) => {
      if (!tag) return null;
      const start = tiff + u32(tag.value);
      const out = [];
      for (let i = 0; i < tag.count; i += 1) {
        const num = u32(start + i * 8);
        const den = u32(start + i * 8 + 4);
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
      const latRef = ascii(gps[0x0001]);
      const lngRef = ascii(gps[0x0003]);

      const toDegrees = (parts) =>
        parts ? parts[0] + parts[1] / 60 + parts[2] / 3600 : null;

      if (lat && lng) {
        result.lat = toDegrees(lat) * (latRef === "S" ? -1 : 1);
        result.lng = toDegrees(lng) * (lngRef === "W" ? -1 : 1);
      }
    }

    return result;
  }
  return {};
}

export async function exifOf(file) {
  try {
    // The EXIF block lives at the front, so 256KB is always enough.
    const head = await file.slice(0, 262144).arrayBuffer();
    return readExif(head);
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------- resampling */

async function toBitmap(file) {
  // imageOrientation "from-image" makes the browser apply the EXIF rotation,
  // so portrait photos are not silently drawn on their side.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
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
export async function uploadImage(prepared, { dayId, dayDate, category, shotBy, personId, caption }) {
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

  const { error } = await supabase.from("media").insert({
    day_id: dayId,
    person_id: personId || null,
    shot_by: shotBy || null,
    category: category || "other",
    provider: "supabase",
    storage_path: path,
    thumb_path: path,
    width: prepared.width,
    height: prepared.height,
    bytes: prepared.bytes,
    taken_at: prepared.takenAt,
    lat: prepared.lat,
    lng: prepared.lng,
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
