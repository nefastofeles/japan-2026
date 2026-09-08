/* ==========================================================================
   Photos - everything, filterable.
   ========================================================================== */

import { allMedia, getLeg } from "../store.js";
import { isConfigured } from "../config.js";
import { esc } from "../util.js";
import { photoGrid, bindPhotoGrid } from "../components/photo-grid.js";

const CATEGORIES = [
  ["all", "Everything"],
  ["place", "Places"],
  ["people", "Us"],
];

export async function photosPage() {
  const media = await allMedia({ limit: 1000 });
  const photos = media.filter(
    (m) => m.provider !== "youtube" && m.category !== "food" && !m.meal_id
  );

  if (!photos.length) {
    return `
      <div class="page stack">
        <h1>Photos</h1>
        ${
          !isConfigured()
            ? `<p class="notice"><strong>Plan mode.</strong> Connect Supabase and the
               gallery fills up as we go.</p>`
            : `<p class="empty">No photos yet.</p>`
        }
      </div>`;
  }

  const filters = CATEGORIES.map(
    ([value, label]) =>
      `<button class="reaction" data-filter="${value}"
               ${value === "all" ? 'aria-pressed="true"' : 'aria-pressed="false"'}>
         ${esc(label)}
       </button>`
  ).join("");

  return {
    html: `
      <div class="page stack">
        <h1>Photos</h1>
        <p class="muted">${photos.length} photos across the trip.</p>
        <div class="reactions" role="group" aria-label="Filter photos">${filters}</div>
        <div data-gallery>${await photoGrid(photos)}</div>
      </div>`,

    mount(root) {
      const holder = root.querySelector("[data-gallery]");
      bindPhotoGrid(holder, photos);

      root.querySelectorAll("[data-filter]").forEach((button) => {
        button.addEventListener("click", async () => {
          const value = button.dataset.filter;
          root.querySelectorAll("[data-filter]").forEach((b) =>
            b.setAttribute("aria-pressed", String(b === button))
          );
          const subset =
            value === "all" ? photos : photos.filter((p) => p.category === value);
          holder.innerHTML = await photoGrid(subset, {
            emptyMessage: "Nothing in this category yet.",
          });
          bindPhotoGrid(holder, subset);
        });
      });
    },
  };
}

export { getLeg };
