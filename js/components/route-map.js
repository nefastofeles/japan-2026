/* ==========================================================================
   Illustrated Japan map
   --------------------------------------------------------------------------
   A recognisable island silhouette on washi, with a vermilion thread for
   the trip. Each stop is a numbered stage. Wikipedia sits in the list
   below, not on the drawing.
   ========================================================================== */

import { getTravelDays, getLeg, allMedia } from "../store.js";
import { esc } from "../util.js";
import { MAP_CITIES, MAP_ROUTE } from "../places.js";
import { LAND_RINGS, FUJI, MAP_VIEWBOX, project } from "./japan-outline.js";

const MAP_W = 640;
const MAP_H = 760;

function cityPoint(city) {
  const [x, y] = project(city.lng, city.lat);
  return [x + (city.nudgeX || 0), y + (city.nudgeY || 0)];
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

function ringPath(ring) {
  return ring.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z";
}

function routePath() {
  return MAP_ROUTE.map((id, i) => {
    const [x, y] = cityPoint(cityById(id));
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
}

function fujiMark() {
  const [x, y] = FUJI;
  return `
    <g class="japan-map__fuji" aria-hidden="true">
      <path d="M ${x - 12} ${y + 5} L ${x} ${y - 16} L ${x + 12} ${y + 5} Z" />
    </g>`;
}

function photoDots(media) {
  return (media || [])
    .filter((photo) => photo.lat && photo.lng)
    .map((photo) => {
      const [x, y] = project(photo.lng, photo.lat);
      if (x < 0 || y < 0 || x > MAP_W || y > MAP_H) return "";
      return `<circle class="japan-map__photo" cx="${x}" cy="${y}" r="3" />`;
    })
    .join("");
}

function cityMarks() {
  return MAP_CITIES.map((city) => {
    const [x, y] = cityPoint(city);
    const href = firstDayHref(city);
    const colour = getLeg(city.leg).colour;
    return `
      <a href="${esc(href)}" data-leg="${esc(city.leg)}">
        <circle class="japan-map__halo" cx="${x}" cy="${y}" r="11"
                fill="${esc(colour)}" />
        <circle class="japan-map__dot" cx="${x}" cy="${y}" r="7.5"
                fill="${esc(colour)}" />
        <text class="japan-map__num" x="${x}" y="${y + 4}"
              text-anchor="middle">${city.stage}</text>
      </a>`;
  }).join("");
}

function cityList() {
  const ordered = [...MAP_CITIES].sort((a, b) => a.stage - b.stage);
  return `
    <ol class="japan-map__list">
      ${ordered.map((city) => {
        const days = daysForCity(city);
        const href = firstDayHref(city);
        return `
          <li class="japan-map__place" data-leg="${esc(city.leg)}">
            <span class="japan-map__stage" aria-hidden="true">${city.stage}</span>
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
    </ol>`;
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

  element.classList.add("japan-map");
  element.innerHTML = `
    <div class="japan-map__art" role="img"
         aria-label="Japan, with numbered stages of the family trip">
      <svg viewBox="${MAP_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">
        <rect class="japan-map__sea" width="${MAP_W}" height="${MAP_H}" />
        ${LAND_RINGS.map((ring) => `<path class="japan-map__land" d="${ringPath(ring)}" />`).join("")}
        ${fujiMark()}
        <path class="japan-map__route" d="${routePath()}" />
        ${photoDots(media)}
        ${cityMarks()}
      </svg>
    </div>
    ${cityList()}`;
}
