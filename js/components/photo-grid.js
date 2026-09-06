/* ==========================================================================
   Photo grid
   --------------------------------------------------------------------------
   The single most important rule in this file: grids load from the `thumbs`
   bucket, never from `photos`.

   A page of 300 dishes at full size is about 100MB and would burn through the
   free bandwidth allowance in three visits. The same page in thumbnails is
   about 10MB. Full resolution is fetched only when someone taps a photo.
   ========================================================================== */

import { esc } from "../util.js";
import { signPaths } from "../supabase.js";
import { openLightbox } from "./lightbox.js";

/* Resolved signed URLs, kept for the life of the page so switching between
   days does not re-sign the same thumbnails over and over. */
const thumbCache = new Map();

export async function photoGrid(items, { emptyMessage = "No photos yet." } = {}) {
  const photos = items.filter((m) => m.provider !== "youtube");
  if (!photos.length) return `<p class="empty">${esc(emptyMessage)}</p>`;

  const isLocal = (path) =>
    path && (path.startsWith("assets/") || /^https?:\/\//.test(path));

  const missing = photos
    .map((p) => p.thumb_path)
    .filter((path) => path && !isLocal(path) && !thumbCache.has(path));

  if (missing.length) {
    const signed = await signPaths("thumbs", missing);
    for (const [path, url] of signed) thumbCache.set(path, url);
  }

  const cells = photos
    .map((photo, index) => {
      const url = isLocal(photo.thumb_path)
        ? photo.thumb_path
        : thumbCache.get(photo.thumb_path) || "";
      const alt = photo.caption || "Trip photo";
      const badge = photo.category === "food" ? "🍜" : "";

      return `<button class="photo-grid__item" data-index="${index}"
                      aria-label="${esc(alt)}">
                ${
                  url
                    ? `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
                    : ""
                }
                ${badge ? `<span class="photo-grid__badge">${badge}</span>` : ""}
              </button>`;
    })
    .join("");

  return `<div class="photo-grid" data-photo-grid>${cells}</div>`;
}

/** Wire the grid up to the lightbox. Call after inserting the HTML. */
export function bindPhotoGrid(root, items) {
  const photos = items.filter((m) => m.provider !== "youtube");
  root.querySelectorAll("[data-photo-grid] .photo-grid__item").forEach((button) => {
    button.addEventListener("click", () => {
      openLightbox(photos, Number(button.dataset.index));
    });
  });
}
