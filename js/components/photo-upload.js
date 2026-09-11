/* ==========================================================================
   Add photos to the day you are looking at.
   --------------------------------------------------------------------------
   Admin is in the footer and easy to miss. The day page is where photos
   belong, so the picker lives here too. Same pipeline as Admin: resize in
   the browser, then storage + a media row.
   ========================================================================== */

import { prepareImage } from "../media.js";
import { addPhoto } from "../posts.js";

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif";

export function photoUploadMarkup() {
  return `
    <div class="photo-upload" data-photo-upload>
      <label class="photo-upload__drop">
        <input class="visually-hidden" type="file" accept="${ACCEPT}"
               multiple data-upload-files>
        <span>Drop photos here, or click to choose. Use JPEG or PNG.
          Chrome cannot read iPhone HEIC.</span>
      </label>
      <p class="muted" data-upload-list></p>
      <button class="btn" type="button" data-upload-go>Add these photos to this day</button>
      <p data-upload-status role="status"></p>
    </div>`;
}

function listFiles(files) {
  return files
    .map((file) => `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`)
    .join(" · ");
}

export function errorText(error) {
  return error?.message || error?.error || error?.hint || "Upload failed.";
}

export async function uploadPhotoFiles(day, files, { category, place } = {}, onProgress) {
  let done = 0;
  let failed = 0;
  let lastError = "";
  const chosen = [...files];
  for (const file of chosen) {
    onProgress?.(done + failed + 1, chosen.length);
    try {
      const prepared = await prepareImage(file);
      await addPhoto(day, prepared, { category, place });
      done += 1;
    } catch (error) {
      console.error(file.name, error);
      failed += 1;
      lastError = errorText(error);
    }
  }
  return { done, failed, lastError, total: chosen.length };
}

export function bindPhotoUpload(root, day) {
  const box = root.querySelector("[data-photo-upload]");
  if (!box) return;

  const input = box.querySelector("[data-upload-files]");
  const list = box.querySelector("[data-upload-list]");
  const status = box.querySelector("[data-upload-status]");
  const go = box.querySelector("[data-upload-go]");

  const chosen = () => Array.from(input.files || []);

  const showList = () => {
    const files = chosen();
    list.textContent = files.length ? listFiles(files) : "";
  };

  input.addEventListener("change", showList);

  box.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  box.addEventListener("drop", (event) => {
    event.preventDefault();
    const transfer = new DataTransfer();
    for (const file of event.dataTransfer.files) transfer.items.add(file);
    input.files = transfer.files;
    showList();
  });

  go.addEventListener("click", async () => {
    const files = chosen();
    if (!files.length) {
      status.textContent = "Pick some photos first.";
      return;
    }
    go.disabled = true;
    const result = await uploadPhotoFiles(
      day,
      files,
      { category: "place" },
      (n, of) => {
        status.textContent = `Uploading ${n} of ${of}…`;
      }
    );
    go.disabled = false;
    status.textContent =
      `Uploaded ${result.done} of ${result.total}.` +
      (result.failed ? ` ${result.failed} failed. ${result.lastError}` : "");
    if (result.done) {
      status.textContent += " Showing them…";
      // Give PostgREST a beat so the new row is there after reload.
      setTimeout(() => location.reload(), 400);
    }
  });
}
