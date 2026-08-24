/* ==========================================================================
   Lightbox - the only place a full-size photo is ever downloaded.
   ========================================================================== */

import { esc } from "../util.js";
import { signPaths } from "../supabase.js";

let items = [];
let index = 0;
let node = null;

const fullCache = new Map();

async function fullUrl(item) {
  if (!item.storage_path) return "";
  if (fullCache.has(item.storage_path)) return fullCache.get(item.storage_path);
  const signed = await signPaths("photos", [item.storage_path]);
  const url = signed.get(item.storage_path) || "";
  fullCache.set(item.storage_path, url);
  return url;
}

async function draw() {
  const item = items[index];
  if (!item) return;

  const image = node.querySelector("img");
  const caption = node.querySelector(".lightbox__caption");

  image.alt = item.caption || "Trip photo";
  caption.textContent = item.caption || "";
  image.src = await fullUrl(item);

  node.querySelector(".lightbox__nav--prev").hidden = items.length < 2;
  node.querySelector(".lightbox__nav--next").hidden = items.length < 2;
}

function move(step) {
  index = (index + step + items.length) % items.length;
  draw();
}

function onKey(event) {
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") move(-1);
  if (event.key === "ArrowRight") move(1);
}

export function closeLightbox() {
  if (!node) return;
  node.remove();
  node = null;
  document.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
}

export function openLightbox(list, startAt = 0) {
  closeLightbox();
  items = list;
  index = startAt;

  node = document.createElement("div");
  node.className = "lightbox";
  node.setAttribute("role", "dialog");
  node.setAttribute("aria-modal", "true");
  node.setAttribute("aria-label", "Photo");
  node.innerHTML = `
    <button class="lightbox__close" aria-label="Close">&times;</button>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo">&#8249;</button>
    <button class="lightbox__nav lightbox__nav--next" aria-label="Next photo">&#8250;</button>
    <div>
      <img alt="">
      <p class="lightbox__caption"></p>
    </div>`;

  node.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  node.querySelector(".lightbox__nav--prev").addEventListener("click", () => move(-1));
  node.querySelector(".lightbox__nav--next").addEventListener("click", () => move(1));
  node.addEventListener("click", (event) => {
    if (event.target === node) closeLightbox();
  });

  document.body.appendChild(node);
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKey);
  node.querySelector(".lightbox__close").focus();

  draw();
}

export { esc };
