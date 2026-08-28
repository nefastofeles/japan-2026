/* ==========================================================================
   Map - the route, and eventually the photos pinned where they were taken.
   --------------------------------------------------------------------------
   The drawing lives in route-map.js so the home page can show the same Japan
   shape without duplicating Leaflet setup. Phase 3 adds the GPX track for the
   Magome to Tsumago walk on 2 October.
   ========================================================================== */

import { mountRouteMap } from "../components/route-map.js";

export async function mapPage() {
  return {
    html: `
      <div class="page stack">
        <h1>The route</h1>
        <p class="measure muted">
          Eleven legs from Tokyo down to Hiroshima, north to Kanazawa, into the
          Alps and back. Tap a marker for that day.
        </p>
        <div id="map" class="route-map"></div>
        <p class="xs muted">Map data &copy; OpenStreetMap contributors.</p>
      </div>`,

    async mount() {
      await mountRouteMap(document.getElementById("map"), { photos: true });
    },
  };
}
