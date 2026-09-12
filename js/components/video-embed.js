/* ==========================================================================
   Video - unlisted YouTube.
   --------------------------------------------------------------------------
   Nothing is uploaded through this site. Clips go up from the YouTube app as
   Unlisted, and the admin pastes the link. YouTube handles the transcoding,
   the adaptive streaming and the bandwidth.

   The poster starts at maxresdefault (1280×720). Many unlisted clips have
   that file; if YouTube 404s it, we step down to sddefault then hqdefault
   so the card never stays blank. The iframe is only created on play.
   ========================================================================== */

import { esc } from "../util.js";

function posterUrl(id, kind) {
  return `https://img.youtube.com/vi/${encodeURIComponent(id)}/${kind}.jpg`;
}

export function videoEmbed(id, caption = "") {
  if (!id) return "";
  const label = caption ? `Play video: ${caption}` : "Play video";

  return `
    <figure class="stack">
      <div class="video-embed" data-video="${esc(id)}">
        <button class="video-embed__poster" type="button" aria-label="${esc(label)}">
          <img class="video-embed__img" src="${posterUrl(id, "maxresdefault")}"
               alt="" width="1280" height="720" loading="lazy" decoding="async"
               data-poster-id="${esc(id)}">
          <span class="video-embed__play" aria-hidden="true">&#9654;</span>
        </button>
      </div>
      ${caption ? `<figcaption class="small muted">${esc(caption)}</figcaption>` : ""}
    </figure>`;
}

const POSTER_STEPS = ["maxresdefault", "sddefault", "hqdefault"];

function bindPosterFallback(image) {
  let step = 0;
  const bump = () => {
    const id = image.dataset.posterId;
    if (!id) return;
    step += 1;
    const next = POSTER_STEPS[step];
    if (next) image.src = posterUrl(id, next);
  };
  image.addEventListener("error", bump);
  image.addEventListener("load", () => {
    // YouTube often 200s a 120×90 dummy instead of 404ing maxresdefault.
    if (image.naturalWidth > 0 && image.naturalWidth < 400) bump();
  });
}

/** Swap the poster for a real player on first click. */
export function bindVideos(root = document) {
  root.querySelectorAll(".video-embed__img").forEach(bindPosterFallback);
  root.querySelectorAll(".video-embed__poster").forEach((button) => {
    button.addEventListener("click", () => {
      const wrap = button.closest(".video-embed");
      const id = wrap.dataset.video;
      wrap.innerHTML = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"
          title="Trip video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen></iframe>`;
    });
  });
}
