/**
 * Optional hero visual and “Tell me more”. Missing media is fine.
 * The image is cropped short so the main button still fits on an iPhone.
 */

import { esc } from "../util.js";
import { listenBar } from "../components/quest-chrome.js";

export function visualHtml(item) {
  const picture = item?.visual;
  if (picture?.src) {
    const kind = picture.type || "image";
    return `
      <figure class="quest-visual" data-visual="${esc(kind)}">
        <img src="${esc(picture.src)}" alt="${esc(picture.alt || "")}"
             width="800" height="360">
        ${
          picture.credit
            ? `<figcaption class="quest-visual__credit">${esc(picture.credit)}</figcaption>`
            : ""
        }
      </figure>`;
  }
  if (item?.icon) {
    return `<p class="quest-visual-icon" aria-hidden="true">${esc(item.icon)}</p>`;
  }
  return "";
}

export function moreInfoHtml(info) {
  if (!info?.text) return "";
  return `
    <button type="button" class="btn btn--ghost" data-more>Tell me more</button>
    <div class="quest-more" data-more-panel hidden>
      ${info.title ? `<p class="quest-label">${esc(info.title)}</p>` : ""}
      ${listenBar("more")}
      <div class="quest-prose"><p>${esc(info.text)}</p></div>
    </div>`;
}

export function bindMoreInfo(root, texts, info) {
  if (!info?.text) return;
  texts.more = info.text;
  root.querySelector("[data-more]")?.addEventListener("click", (event) => {
    const panel = root.querySelector("[data-more-panel]");
    if (panel) panel.hidden = false;
    event.currentTarget.hidden = true;
  });
}
