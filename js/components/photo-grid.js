/* ==========================================================================
   Photo grid
   --------------------------------------------------------------------------
   The single most important rule in this file: grids load from the `thumbs`
   bucket, never from `photos`.

   A page of 300 dishes at full size is about 100MB and would burn through the
   free bandwidth allowance in three visits. The same page in thumbnails is
   about 10MB. Full resolution is fetched only when someone taps a photo.
   ========================================================================== */

import { esc, clockFromStamp } from "../util.js";
import { signPaths } from "../supabase.js";
import { openLightbox } from "./lightbox.js";

export const DAY_PHOTO_LIMIT = 24;
export const DAY_VIDEO_LIMIT = 12;
export const MEAL_PHOTO_LIMIT = 3;

/* Resolved signed URLs, kept for the life of the page so switching between
   days does not re-sign the same thumbnails over and over. */
const thumbCache = new Map();

function isLocalPath(path) {
  return (
    path &&
    (path.startsWith("assets/") ||
      path.startsWith("blob:") ||
      /^https?:\/\//.test(path))
  );
}

export async function photoGrid(items, { emptyMessage = "No photos yet.", bindable = true } = {}) {
  const photos = items.filter((m) => m.provider !== "youtube");
  if (!photos.length) return `<p class="empty">${esc(emptyMessage)}</p>`;

  const missing = photos
    .map((p) => p.thumb_path)
    .filter((path) => path && !isLocalPath(path) && !thumbCache.has(path));

  if (missing.length) {
    const signed = await signPaths("thumbs", missing);
    for (const [path, url] of signed) thumbCache.set(path, url);
  }

  const cells = photos
    .map((photo, index) => {
      const url = isLocalPath(photo.thumb_path)
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

  return `<div class="photo-grid"${bindable ? " data-photo-grid" : ""}>${cells}</div>`;
}

function mapsHref(lat, lng) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

function photoInfo(photo, fallbackPlace) {
  const place = photo.place || fallbackPlace || "";
  const time = clockFromStamp(photo.taken_at);
  const hasGeo = photo.lat != null && photo.lng != null;
  const rows = [];
  if (place) {
    rows.push(`<p class="photo-card__row"><span class="photo-card__k">Place</span>
                 <span>${esc(place)}</span></p>`);
  }
  if (time) {
    rows.push(`<p class="photo-card__row"><span class="photo-card__k">Time</span>
                 <span>${esc(time)}</span></p>`);
  }
  if (hasGeo) {
    const label = `${Number(photo.lat).toFixed(4)}, ${Number(photo.lng).toFixed(4)}`;
    rows.push(`<p class="photo-card__row"><span class="photo-card__k">Map</span>
                 <a href="${esc(mapsHref(photo.lat, photo.lng))}"
                    target="_blank" rel="noopener">${esc(label)}</a></p>`);
  }
  return rows.length ? `<div class="photo-card__info">${rows.join("")}</div>` : "";
}

/** Day-page album: one card per photo, with place, time and a Maps link.
    Caps at 24 so a full day stays readable on a phone. */
export async function photoAlbum(items, { fallbackPlace = "" } = {}) {
  const photos = items.filter((m) => m.provider !== "youtube").slice(0, DAY_PHOTO_LIMIT);
  if (!photos.length) return `<p class="empty">No photos yet.</p>`;

  const missing = photos
    .map((p) => p.thumb_path)
    .filter((path) => path && !isLocalPath(path) && !thumbCache.has(path));

  if (missing.length) {
    const signed = await signPaths("thumbs", missing);
    for (const [path, url] of signed) thumbCache.set(path, url);
  }

  const cards = photos
    .map((photo, index) => {
      const url = isLocalPath(photo.thumb_path)
        ? photo.thumb_path
        : thumbCache.get(photo.thumb_path) || "";
      const alt = photo.caption || photo.place || "Trip photo";
      return `
        <figure class="photo-card">
          <button class="photo-card__shot" data-index="${index}"
                  aria-label="${esc(alt)}">
            ${
              url
                ? `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
                : ""
            }
          </button>
          ${photo.caption ? `<figcaption class="photo-card__caption">${esc(photo.caption)}</figcaption>` : ""}
          ${photoInfo(photo, fallbackPlace)}
        </figure>`;
    })
    .join("");

  return `<div class="photo-album" data-photo-album>${cards}</div>`;
}

/** Wire the grid up to the lightbox. Call after inserting the HTML. */
export function bindPhotoGrid(root, items) {
  const photos = items.filter((m) => m.provider !== "youtube");
  root.querySelectorAll("[data-photo-grid] .photo-grid__item").forEach((button) => {
    button.addEventListener("click", () => {
      openLightbox(photos, Number(button.dataset.index));
    });
  });
  const albumPhotos = photos.slice(0, DAY_PHOTO_LIMIT);
  root.querySelectorAll("[data-photo-album] .photo-card__shot").forEach((button) => {
    button.addEventListener("click", () => {
      openLightbox(albumPhotos, Number(button.dataset.index));
    });
  });
}
