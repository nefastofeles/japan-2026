/* ==========================================================================
   Live weather - Open-Meteo, no API key.
   --------------------------------------------------------------------------
   The four-year averages in itinerary.json stay as the plan. This file asks
   what each city is doing right now, so grandparents can look at Kyoto on a
   Tuesday evening and see the rain. If the phone has no signal, the live
   lines stay hidden and the averages remain.
   ========================================================================== */

import { TRIP } from "./config.js";
import { esc } from "./util.js";
import { CITY_FOR_LEG, PLACES, weatherVenues } from "./places.js";

const CACHE_MS = 15 * 60 * 1000;
let cache = null;

function skyFor(code) {
  if (code === 0) return "clear";
  if (code === 1) return "mostly clear";
  if (code <= 3) return "cloudy";
  if (code <= 48) return "foggy";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  if (code <= 86) return "snow showers";
  return "thunder";
}

export async function liveWeather() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.byCity;

  const venues = weatherVenues();
  if (!venues.length) return new Map();

  const lats = venues.map((v) => v.lat).join(",");
  const lngs = venues.map((v) => v.lng).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
    `&current=temperature_2m,weather_code,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
    `&forecast_days=16&timezone=${encodeURIComponent(TRIP.timezone)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("weather request failed");
    let payload = await response.json();
    if (!Array.isArray(payload)) payload = [payload];

    const byCity = new Map();
    payload.forEach((row, index) => {
      const venue = venues[index];
      if (!venue || !row.current) return;

      const daily = {};
      const days = row.daily && row.daily.time ? row.daily.time : [];
      days.forEach((date, dayIndex) => {
        daily[date] = {
          high: Math.round(row.daily.temperature_2m_max[dayIndex]),
          low: Math.round(row.daily.temperature_2m_min[dayIndex]),
          code: row.daily.weather_code[dayIndex],
          rainChance: row.daily.precipitation_probability_max[dayIndex],
        };
      });

      byCity.set(venue.city, {
        temp: Math.round(row.current.temperature_2m),
        code: row.current.weather_code,
        rain: row.current.precipitation,
        daily,
        venue,
      });
    });

    cache = { at: Date.now(), byCity };
    return byCity;
  } catch {
    return cache ? cache.byCity : new Map();
  }
}

function nowPhrase(snap) {
  const raining = snap.rain > 0 ? ", raining" : "";
  return `${snap.temp}°C, ${skyFor(snap.code)}${raining}`;
}

export function weatherBoard() {
  const venues = weatherVenues();
  if (!venues.length) return "";

  return `
    <section>
      <h2 class="section-title">Right now</h2>
      <p class="measure muted">Live weather at each place we stay.</p>
      <div class="weather-now">
        ${venues
          .map(
            (v) => `<div class="weather-now__card" data-leg="${esc(v.leg)}"
                         data-live-city="${esc(v.city)}">
                      <p class="weather-now__place">${esc(v.label)}</p>
                      <p class="weather-now__temp" data-live-temp>—</p>
                      <p class="weather-now__sky muted" data-live-sky></p>
                    </div>`
          )
          .join("")}
      </div>
      <p class="xs muted">Weather from Open-Meteo.com</p>
    </section>`;
}

export function liveWeatherLine(city, date) {
  if (!PLACES[city]) return "";
  return `<p class="transit" data-live-line data-live-city="${esc(city)}"
             data-live-date="${esc(date || "")}" hidden>
            <span aria-hidden="true">🌡️</span>
            <span data-live-line-text></span>
          </p>`;
}

export function cityForLeg(legId) {
  return CITY_FOR_LEG[legId] || "";
}

export async function bindLiveWeather(root) {
  const byCity = await liveWeather();
  if (!byCity.size) return;

  root.querySelectorAll("[data-live-city]").forEach((el) => {
    const snap = byCity.get(el.dataset.liveCity);
    if (!snap) return;

    const temp = el.querySelector("[data-live-temp]");
    const sky = el.querySelector("[data-live-sky]");
    if (temp) temp.textContent = `${snap.temp}°`;
    if (sky) sky.textContent = skyFor(snap.code);

    const lineText = el.querySelector("[data-live-line-text]");
    if (!lineText) return;

    const forecast = el.dataset.liveDate && snap.daily[el.dataset.liveDate];
    let text = `Now in ${snap.venue.label}: ${nowPhrase(snap)}`;
    if (forecast) {
      text += `. This day ${forecast.high}°C / ${forecast.low}°C, ${skyFor(forecast.code)}`;
      if (forecast.rainChance != null) {
        text += `, ${forecast.rainChance}% chance of rain`;
      }
    }
    lineText.textContent = text;
    el.hidden = false;
  });
}
