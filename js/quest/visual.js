/**
 * Optional hero visual and “Tell me more”. Missing media is an intentional
 * chapter mark, never an empty hole.
 */

import { esc } from "../util.js";
import { listenBar } from "../components/quest-chrome.js";
import { typeIcon } from "../components/quest-icons.js";
import { resolveVisual } from "./media.js";

export function visualHtml(item, quest, { compact, complete } = {}) {
  const picture = resolveVisual(item, quest, { complete });
  const chapterId = item?.chapterId || "";
  const kind = item?.type || "quest";
  const extra = compact ? " quest-visual--card" : "";
  if (picture?.src) {
    const mediaKind = picture.type || "image";
    const remote = /^https?:\/\//.test(picture.src) || picture.src.startsWith("blob:");
    const src = remote || picture.src.includes("?")
      ? picture.src
      : `${picture.src}?v=42`;
    return `
      <figure class="quest-visual${extra}" data-visual="${esc(mediaKind)}" data-chapter="${esc(chapterId)}">
        <img src="${esc(src)}" alt="${esc(picture.alt || "")}"
             width="800" height="450"
             loading="${compact ? "lazy" : "eager"}" decoding="async">
        ${
          !compact && picture.credit
            ? `<figcaption class="quest-visual__credit">${esc(picture.credit)}</figcaption>`
            : ""
        }
      </figure>`;
  }
  return `
    <div class="quest-visual quest-visual--mark${extra}" data-chapter="${esc(chapterId)}"
         data-kind="${esc(kind)}" aria-hidden="true">
      ${typeIcon(kind)}
    </div>`;
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
  if (!info?.text && !info?.audioText) return;
  texts.more = info.audioText || info.text;
  root.querySelector("[data-more]")?.addEventListener("click", (event) => {
    const panel = root.querySelector("[data-more-panel]");
    if (panel) panel.hidden = false;
    event.currentTarget.hidden = true;
  });
}
