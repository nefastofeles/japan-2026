/* ==========================================================================
   Map - an illustrated Japan, not a street map.
   --------------------------------------------------------------------------
   The drawing lives in route-map.js so the home page can show the same ink
   shape. Wikipedia sits next to each city. Phase 3 still adds the GPX track
   for the Magome to Tsumago walk on 2 October.
   ========================================================================== */

import { mountRouteMap } from "../components/route-map.js";

export async function mapPage() {
  return {
    html: `
      <div class="page stack">
        <h1>The route</h1>
        <p class="measure muted">
          Japan, drawn in ink on washi. Numbered stages from Tokyo to
          Tokoname. Tap a number for that day, or open Wikipedia.
        </p>
        <div id="map" class="japan-map-host"></div>
      </div>`,

    async mount() {
      await mountRouteMap(document.getElementById("map"), { photos: true });
    },
  };
}
