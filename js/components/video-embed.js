/* ==========================================================================
   Video - unlisted YouTube.
   --------------------------------------------------------------------------
   Nothing is uploaded through this site. Clips go up from the YouTube app as
   Unlisted, and the admin pastes the link. YouTube handles the transcoding,
   the adaptive streaming and the bandwidth.

   The poster image comes from YouTube too, so the iframe is only created when
   someone actually presses play. Twenty video embeds on one page would
   otherwise make it crawl.
   ========================================================================== */

import { esc } from "../util.js";

export function videoEmbed(id, caption = "") {
  if (!id) return "";
  const poster = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return `
    <figure class="stack">
      <div class="video-embed" data-video="${esc(id)}">
        <button class="video-embed__poster"
                style="background-image:url('${poster}')"
                aria-label="Play video${caption ? ": " + esc(caption) : ""}">
          <span class="video-embed__play" aria-hidden="true">&#9654;</span>
        </button>
      </div>
      ${caption ? `<figcaption class="small muted">${esc(caption)}</figcaption>` : ""}
    </figure>`;
}

/** Swap the poster for a real player on first click. */
export function bindVideos(root = document) {
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
