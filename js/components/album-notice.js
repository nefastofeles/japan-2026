/* Why a shared-album banner: picking a file is not the same as saving it
   online. Grandparents need to know photos live in one place, on every phone. */

import { esc } from "../util.js";

export function albumLoadError(message) {
  return `<p class="notice"><strong>The shared album could not load.</strong>
    ${esc(message || "Try again in a moment.")}
    On this phone, open <a href="refresh.html">this update link</a> once,
    then sign in.</p>`;
}

export function albumSharedNote() {
  return `<p class="muted">Photos and videos are saved in the shared family
    album. They stay after you refresh, and anyone signed in on another
    phone or browser can see them.</p>`;
}
