/* ==========================================================================
   Admin album library
   --------------------------------------------------------------------------
   Day pages only show photos. This is where a facilitator sees what is
   already in the shared album for the selected day, and can delete a miss.
   ========================================================================== */

import { getDay, mediaForDay } from "../store.js";
import { deleteMedia } from "../posts.js";
import { publicUrl } from "../album.js";
import { esc } from "../util.js";

const rowsById = new Map();

export function albumLibraryMarkup() {
  return `
    <section class="card stack">
      <h2 class="section-title">This day's album</h2>
      <p class="small muted">
        Everything already saved for the day above, including meal photos
        and YouTube links. Day pages only show these. Delete a miss here.
      </p>
      <div data-album-library></div>
      <p class="small" data-album-lib-status role="status"></p>
    </section>`;
}

function previewSrc(item) {
  if (item.provider === "youtube" && item.external_id) {
    const id = encodeURIComponent(item.external_id);
    return `https://img.youtube.com/vi/${id}/sddefault.jpg`;
  }
  const path = item.thumb_path || item.storage_path || "";
  if (!path) return "";
  if (
    path.startsWith("blob:") ||
    path.startsWith("assets/") ||
    /^https?:\/\//.test(path)
  ) {
    return path;
  }
  return publicUrl("thumbs", path, item.updated_at || item.created_at);
}

function kindLabel(item) {
  if (item.provider === "youtube") return "Video";
  if (item.meal_id || item.category === "food") return "Meal photo";
  if (item.category === "people") return "Us";
  if (item.category === "place") return "Place";
  return "Photo";
}

function rowMarkup(item) {
  const src = previewSrc(item);
  const where = item.place || item.caption || "No place yet";
  const alt = item.caption || item.place || kindLabel(item);
  return `
    <article class="admin-media__row">
      ${
        src
          ? `<img src="${esc(src)}" alt="${esc(alt)}" width="176" height="176"
                   loading="lazy" decoding="async">`
          : `<div class="admin-media__gap" aria-hidden="true"></div>`
      }
      <div>
        <p><strong>${esc(kindLabel(item))}</strong></p>
        <p class="small">${esc(where)}</p>
      </div>
      <button class="btn btn--ghost" type="button" data-delete-media="${esc(item.id)}">
        Delete
      </button>
    </article>`;
}

export async function refreshAlbumLibrary(root) {
  const mount = root.querySelector("[data-album-library]");
  const status = root.querySelector("[data-album-lib-status]");
  const select = root.querySelector("[data-day]");
  if (!mount || !select) return;
  const day = getDay(select.value);
  mount.innerHTML = `<p class="muted">Loading the shared album…</p>`;
  try {
    const items = await mediaForDay(day);
    rowsById.clear();
    for (const item of items) rowsById.set(item.id, item);
    mount.innerHTML = items.length
      ? `<div class="admin-media">${items.map(rowMarkup).join("")}</div>`
      : `<p class="empty">Nothing in the shared album for this day yet.</p>`;
  } catch (error) {
    rowsById.clear();
    mount.innerHTML = `<p class="notice">${esc(error.message || "Could not load the album.")}</p>`;
  }
}

export function bindAlbumLibrary(root) {
  refreshAlbumLibrary(root);
  root.querySelector("[data-day]")?.addEventListener("change", () => {
    refreshAlbumLibrary(root);
  });
  root.querySelector("[data-album-library]")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-media]");
    if (!button) return;
    const status = root.querySelector("[data-album-lib-status]");
    const item = rowsById.get(button.getAttribute("data-delete-media"));
    if (!item) return;
    if (!window.confirm("Remove this from the shared album on every phone?")) return;
    button.disabled = true;
    if (status) status.textContent = "Removing…";
    try {
      await deleteMedia(item);
      if (status) status.textContent = "Removed. Other phones see this after a refresh.";
      await refreshAlbumLibrary(root);
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = error.message || "Could not delete.";
    }
  });
}
