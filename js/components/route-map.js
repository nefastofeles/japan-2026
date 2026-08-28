/* ==========================================================================
   Route map - Japan stops only, coloured by leg.
   --------------------------------------------------------------------------
   Leaflet is loaded from a CDN the first time a map is shown, so every other
   page stays free of that cost. Copenhagen is deliberately left off: including
   it zooms the map out to Eurasia and Japan becomes a blob.
   ========================================================================== */

import { getTravelDays, getLeg, allMedia } from "../store.js";
import { esc } from "../util.js";
import { coordsForCity } from "../places.js";

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

function japanStops() {
  return getTravelDays()
    .map((day) => ({ day, coords: coordsForCity(day.city) }))
    .filter((stop) => stop.coords);
}

export async function mountRouteMap(element, { photos = false } = {}) {
  if (!element) return;

  let L;
  try {
    L = await loadLeaflet();
  } catch (error) {
    element.innerHTML = `<p class="empty">${esc(error.message)}</p>`;
    return;
  }

  const stops = japanStops();
  if (!stops.length) {
    element.innerHTML = `<p class="empty">The route will appear here.</p>`;
    return;
  }

  const map = L.map(element, { scrollWheelZoom: false });
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

  const bounds = L.latLngBounds(line);
  map.fitBounds(bounds, { padding: [40, 40] });
  // The map is inserted into a freshly rendered page, so Leaflet needs a
  // second pass once the box has a real width.
  requestAnimationFrame(() => {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [40, 40] });
  });

  if (!photos) return;

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
}
