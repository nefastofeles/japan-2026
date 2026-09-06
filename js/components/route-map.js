/* ==========================================================================
   Illustrated Japan map
   --------------------------------------------------------------------------
   A recognisable four-island silhouette. Each stop is a numbered stage,
   not a street pin. Wikipedia sits next to each name in the list below.
   ========================================================================== */

import { getTravelDays, getLeg, allMedia } from "../store.js";
import { esc } from "../util.js";
import { MAP_CITIES, MAP_ROUTE } from "../places.js";
import {
  JAPAN_FRAME as FRAME, HOKKAIDO, HONSHU, SHIKOKU, KYUSHU,
} from "./japan-outline.js";

function project(lat, lng) {
  const x = ((lng - FRAME.west) / (FRAME.east - FRAME.west)) * FRAME.w;
  const y = ((FRAME.north - lat) / (FRAME.north - FRAME.south)) * FRAME.h;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function cityPoint(city) {
  const [x, y] = project(city.lat, city.lng);
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
  return ring.map(([lat, lng], i) => {
    const [x, y] = project(lat, lng);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ") + " Z";
}

function routePath() {
  return MAP_ROUTE.map((id, i) => {
    const city = cityById(id);
    const [x, y] = cityPoint(city);
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
    const [x, y] = cityPoint(city);
    const href = firstDayHref(city);
    const colour = getLeg(city.leg).colour;
    const stage = city.stage;
    return `
      <a href="${esc(href)}" data-leg="${esc(city.leg)}">
        <circle class="japan-map__halo" cx="${x}" cy="${y}" r="16"
                fill="${esc(colour)}" />
        <circle class="japan-map__dot" cx="${x}" cy="${y}" r="12"
                fill="${esc(colour)}" />
        <text class="japan-map__num" x="${x}" y="${y + 5}"
              text-anchor="middle">${stage}</text>
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
         aria-label="Numbered stages on a map of Japan">
      <svg viewBox="0 0 ${FRAME.w} ${FRAME.h}" xmlns="http://www.w3.org/2000/svg">
        <rect class="japan-map__sea" width="${FRAME.w}" height="${FRAME.h}" />
        <path class="japan-map__land" d="${ringPath(HOKKAIDO)}" />
        <path class="japan-map__land" d="${ringPath(HONSHU)}" />
        <path class="japan-map__land" d="${ringPath(SHIKOKU)}" />
        <path class="japan-map__land" d="${ringPath(KYUSHU)}" />
        <path class="japan-map__route" d="${routePath()}" />
        ${photoDots(media)}
        ${cityMarks()}
      </svg>
    </div>
    ${cityList()}`;
}
