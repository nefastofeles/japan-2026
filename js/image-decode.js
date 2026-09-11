/* ==========================================================================
   Turn a picked file into a bitmap, then a JPEG.
   Chrome on a Mac often cannot read iPhone HEIC, even when the file is
   named .jpeg. We sniff the bytes first so the error is honest.
   ========================================================================== */

function looksLikeHeic(file, bytes) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return true;
  let ascii = "";
  for (const byte of bytes) ascii += byte >= 32 && byte < 127 ? String.fromCharCode(byte) : " ";
  return /ftyp\s*(heic|heix|hevc|hevx|mif1|msf1)/i.test(ascii);
}

export async function assertReadablePhoto(file) {
  if (!file || file.size < 32) {
    throw new Error("That file is empty. If it lives in iCloud, download it first.");
  }
  const head = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  if (looksLikeHeic(file, head)) {
    throw new Error(
      "This is an iPhone HEIC file. Chrome cannot read it. In Photos: File → Export → JPEG, then pick that file."
    );
  }
}

function bitmapFromImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      createImageBitmap(img)
        .then((bitmap) => {
          URL.revokeObjectURL(url);
          resolve(bitmap);
        })
        .catch((error) => {
          URL.revokeObjectURL(url);
          reject(error);
        });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "Chrome could not read this photo. Export it as JPEG from Photos and try that file."
        )
      );
    };
    img.src = url;
  });
}

export async function toBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      return await createImageBitmap(file);
    } catch {
      return bitmapFromImg(file);
    }
  }
}

function scaleTo(width, height, maxEdge) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export async function encodeJpeg(bitmap, maxEdge, quality) {
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
