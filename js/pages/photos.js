/* ==========================================================================
   Photos - everything, filterable.
   ========================================================================== */

import { allMedia, getLeg } from "../store.js";
import { isConfigured } from "../config.js";
import { esc } from "../util.js";
import { photoGrid, bindPhotoGrid } from "../components/photo-grid.js";
import { videoEmbed, bindVideos } from "../components/video-embed.js";
import { albumLoadError, albumSharedNote } from "../components/album-notice.js";

const CATEGORIES = [
  ["all", "Everything"],
  ["place", "Places"],
  ["people", "Us"],
];

export async function photosPage() {
  let media = [];
  let albumError = "";
  try {
    media = await allMedia({ limit: 1000 });
  } catch (error) {
    console.warn("Shared album failed to load", error);
    albumError = error.message || "The shared album could not load.";
  }
  const photos = media.filter(
    (m) => m.provider !== "youtube" && m.category !== "food" && !m.meal_id
  );
  const videos = media.filter((m) => m.provider === "youtube");

  if (albumError) {
    return `
      <div class="page stack">
        <h1>Photos</h1>
        ${albumLoadError(albumError)}
      </div>`;
  }

  if (!photos.length && !videos.length) {
    return `
      <div class="page stack">
        <h1>Photos</h1>
        ${albumSharedNote()}
        ${
          !isConfigured()
            ? `<p class="notice"><strong>Plan mode.</strong> Connect Supabase and the
               gallery fills up as we go.</p>`
            : `<p class="empty">No photos yet in the shared album.</p>
               <p>Add them from Admin. They will then show here
               on every phone after you sign in.</p>`
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
        ${albumSharedNote()}
        ${
          videos.length
            ? `<section>
                 <h2 class="section-title">Video</h2>
                 <p class="muted">${videos.length} video${videos.length === 1 ? "" : "s"} in the shared album.</p>
                 <div class="video-board">${videos
                   .map((v) => videoEmbed(v.external_id, v.caption))
                   .join("")}</div>
               </section>`
            : ""
        }
        ${
          photos.length
            ? `<p class="muted">${photos.length} photos in the shared album.</p>
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
