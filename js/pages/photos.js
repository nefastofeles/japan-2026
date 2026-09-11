/* ==========================================================================
   Photos - everything, filterable.
   ========================================================================== */

import { allMedia, getLeg } from "../store.js";
import { isConfigured } from "../config.js";
import { esc } from "../util.js";
import { photoGrid, bindPhotoGrid } from "../components/photo-grid.js";
import { videoEmbed, bindVideos } from "../components/video-embed.js";

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
  const videos = media.filter((m) => m.provider === "youtube");

  if (!photos.length && !videos.length) {
    return `
      <div class="page stack">
        <h1>Photos</h1>
        ${
          !isConfigured()
            ? `<p class="notice"><strong>Plan mode.</strong> Connect Supabase and the
               gallery fills up as we go.</p>`
            : `<p class="empty">No photos yet.</p>
               <p>If you already posted videos, <a href="refresh.html">tap here once</a>
               to update this phone.</p>`
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
        ${
          videos.length
            ? `<section>
                 <h2 class="section-title">Video</h2>
                 <div class="video-board">${videos
                   .map((v) => videoEmbed(v.external_id, v.caption))
                   .join("")}</div>
               </section>`
            : ""
        }
        ${
          photos.length
            ? `<p class="muted">${photos.length} photos across the trip.</p>
               <div class="reactions" role="group" aria-label="Filter photos">${filters}</div>
               <div data-gallery>${await photoGrid(photos)}</div>`
            : ""
        }
      </div>`,

    mount(root) {
      const holder = root.querySelector("[data-gallery]");
      if (holder) bindPhotoGrid(holder, photos);
      bindVideos(root);

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
