/* ==========================================================================
   Illustrated Japan map
   --------------------------------------------------------------------------
   A washi-and-ink drawing, not a street map. Cities stay as large labelled
   chips so Magome, Tsumago, Shirakawa-go and Tokoname do not disappear into
   a neighbour. Wikipedia sits next to each name. Leaflet is gone on purpose.
   ========================================================================== */

import { getTravelDays, getLeg, allMedia } from "../store.js";
import { esc } from "../util.js";
import { MAP_CITIES, MAP_ROUTE } from "../places.js";

const FRAME = {
  west: 131.35,
  east: 140.7,
  south: 33.82,
  north: 37.18,
  w: 720,
  h: 520,
};

function project(lat, lng) {
  const x = ((lng - FRAME.west) / (FRAME.east - FRAME.west)) * FRAME.w;
  const y = ((FRAME.north - lat) / (FRAME.north - FRAME.south)) * FRAME.h;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function cityById(id) {
  return MAP_CITIES.find((city) => city.id === id);
}

function daysForCity(city) {
  return getTravelDays().filter(
    (day) =>
      (city.cities || []).includes(day.city) ||
      (city.extraDates || []).includes(day.date)
  );
}

function firstDayHref(city) {
  const days = daysForCity(city);
  return days[0] ? `#/day/${days[0].date}` : "#/map";
}

/* Soft Honshu outline in the trip window, drawn as lat/lng so the ink
   sits under the cities instead of tracing a coastline. */
const LAND = [
  [34.12, 132.05], [34.4, 131.55], [34.85, 131.7], [35.35, 132.35],
  [35.85, 133.4], [36.25, 134.7], [36.7, 135.55], [37.12, 136.85],
  [36.75, 137.55], [36.85, 138.35], [36.45, 139.15], [35.95, 140.15],
  [35.45, 140.55], [35.15, 139.85], [34.85, 139.25], [34.55, 138.15],
  [34.4, 136.95], [34.2, 136.15], [34.28, 135.15], [34.18, 134.2],
  [34.22, 133.15], [34.12, 132.05],
];

const MIYAJIMA = [34.27, 132.3];

const LABEL_NUDGE = {
  tokyo: [8, -28],
  kyoto: [-8, 22],
  osaka: [-6, 22],
  hiroshima: [10, -26],
  miyajima: [-18, 24],
  kanazawa: [0, -28],
  "shirakawa-go": [-22, -26],
  takayama: [18, -10],
  magome: [-22, 22],
  tsumago: [20, -26],
  tokoname: [8, 22],
};

function landPath() {
  return LAND.map(([lat, lng], i) => {
    const [x, y] = project(lat, lng);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ") + " Z";
}

function routePath() {
  return MAP_ROUTE.map((id, i) => {
    const city = cityById(id);
    const [x, y] = project(city.lat, city.lng);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
}

function photoDots(media) {
  return (media || [])
    .filter((photo) => photo.lat && photo.lng)
    .map((photo) => {
      const [x, y] = project(photo.lat, photo.lng);
      if (x < 0 || y < 0 || x > FRAME.w || y > FRAME.h) return "";
      return `<circle class="japan-map__photo" cx="${x}" cy="${y}" r="3.5" />`;
    })
    .join("");
}

function cityMarks() {
  return MAP_CITIES.map((city) => {
    const [x, y] = project(city.lat, city.lng);
    const [dx, dy] = LABEL_NUDGE[city.id] || [10, -22];
    const href = firstDayHref(city);
    const colour = getLeg(city.leg).colour;
    return `
      <a href="${esc(href)}" data-leg="${esc(city.leg)}">
        <circle class="japan-map__dot" cx="${x}" cy="${y}" r="9"
                fill="${esc(colour)}" />
        <circle cx="${x}" cy="${y}" r="4" fill="#FAF8F3" />
        <text class="japan-map__svg-label" x="${x + dx}" y="${y + dy}"
              text-anchor="middle">${esc(city.name)}</text>
      </a>`;
  }).join("");
}

function cityList() {
  return `
    <ul class="japan-map__list">
      ${MAP_CITIES.map((city) => {
        const days = daysForCity(city);
        const href = firstDayHref(city);
        return `
          <li class="japan-map__place" data-leg="${esc(city.leg)}">
            <span class="japan-map__swatch" aria-hidden="true"></span>
            <a class="japan-map__name" href="${esc(href)}">${esc(city.name)}
              <span class="jp">${esc(city.jp)}</span></a>
            ${
              days[0]
                ? `<a class="japan-map__day" href="${esc(href)}">${esc(days[0].title)}</a>`
                : ""
            }
            <a class="japan-map__wiki" href="${esc(city.wiki)}"
               target="_blank" rel="noopener">Wikipedia</a>
          </li>`;
      }).join("")}
    </ul>`;
}

export async function mountRouteMap(element, { photos = false } = {}) {
  if (!element) return;

  let media = [];
  if (photos) {
    try {
      media = await allMedia({ limit: 400 });
    } catch {
      media = [];
    }
  }

  const [isleX, isleY] = project(MIYAJIMA[0], MIYAJIMA[1]);

  element.classList.add("japan-map");
  element.innerHTML = `
    <div class="japan-map__art" role="img"
         aria-label="Illustrated map of the Japan route">
      <svg viewBox="0 0 ${FRAME.w} ${FRAME.h}" xmlns="http://www.w3.org/2000/svg">
        <rect class="japan-map__sea" width="${FRAME.w}" height="${FRAME.h}" />
        <path class="japan-map__land" d="${landPath()}" />
        <ellipse class="japan-map__land" cx="${isleX}" cy="${isleY}"
                 rx="10" ry="6" />
        <path class="japan-map__route" d="${routePath()}" />
        ${photoDots(media)}
        ${cityMarks()}
      </svg>
    </div>
    ${cityList()}`;
}
