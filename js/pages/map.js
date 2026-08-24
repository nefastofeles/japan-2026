/* ==========================================================================
   Map - the route, and eventually the photos pinned where they were taken.
   --------------------------------------------------------------------------
   Leaflet and OpenStreetMap, both free, loaded from a CDN only when this page
   is opened so it costs nothing on every other page.

   Phase 3 adds the GPX track for the Magome to Tsumago walk on 2 October,
   which is the one day of the trip with a walking route worth drawing.
   ========================================================================== */

import { getTravelDays, getLeg, allMedia } from "../store.js";
import { esc } from "../util.js";

/* Approximate centres, good enough to draw the shape of the trip. */
const PLACES = {
  "Copenhagen to Tokyo": [55.6180, 12.6508],
  Tokyo: [35.6895, 139.6917],
  Kyoto: [35.0116, 135.7681],
  Osaka: [34.6937, 135.5023],
  Hiroshima: [34.3853, 132.4553],
  Miyajima: [34.2960, 132.3197],
  Kanazawa: [36.5613, 136.6562],
  Takayama: [36.1461, 137.2522],
  "Magome to Tsumago": [35.5769, 137.5722],
  "Tokoname to Tokyo": [34.8863, 136.8320],
  "Tokyo to Copenhagen": [35.5494, 139.7798],
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Could not load the map library."));
    document.head.appendChild(script);
  });
}

export async function mapPage() {
  const days = getTravelDays();

  const stops = days
    .map((day) => ({ day, coords: PLACES[day.city] }))
    .filter((s) => s.coords);

  return {
    html: `
      <div class="page stack">
        <h1>The route</h1>
        <p class="measure muted">
          Eleven legs from Tokyo down to Hiroshima, north to Kanazawa, into the
          Alps and back. Tap a marker for that day.
        </p>
        <div id="map" style="height:60vh;min-height:380px;border-radius:var(--radius-lg);
             overflow:hidden;border:1px solid var(--rule)"></div>
        <p class="xs muted">Map data &copy; OpenStreetMap contributors.</p>
      </div>`,

    async mount() {
      let L;
      try {
        L = await loadLeaflet();
      } catch (error) {
        document.getElementById("map").innerHTML =
          `<p class="empty">${esc(error.message)}</p>`;
        return;
      }

      const map = L.map("map", { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const line = [];
      for (const { day, coords } of stops) {
        const leg = getLeg(day.leg);
        line.push(coords);

        L.circleMarker(coords, {
          radius: 8,
          color: leg.colour,
          fillColor: leg.colour,
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(day.title)}</strong><br>${esc(day.city)}<br>
             <a href="#/day/${esc(day.date)}">Open this day</a>`
          );
      }

      L.polyline(line, { color: "#1A1A1A", weight: 2, opacity: 0.35, dashArray: "4 6" })
        .addTo(map);

      map.fitBounds(L.latLngBounds(line), { padding: [40, 40] });

      // Once photos carry GPS from EXIF, drop them on as small markers too.
      const media = await allMedia({ limit: 400 });
      for (const photo of media) {
        if (photo.lat && photo.lng) {
          L.circleMarker([photo.lat, photo.lng], {
            radius: 4,
            color: "#EB6101",
            fillOpacity: 0.9,
            weight: 1,
          }).addTo(map);
        }
      }
    },
  };
}
