/* ==========================================================================
   Live weather - Open-Meteo, no API key.
   --------------------------------------------------------------------------
   The four-year averages in itinerary.json stay as the plan. This file asks
   what each city is doing right now, so grandparents can look at Kyoto on a
   Tuesday evening and see the rain. Once a calendar day in Japan is over,
   that day's line switches from a forecast to the recorded high, low, sky
   and rainfall. If the phone has no signal, the live lines stay hidden.
   ========================================================================== */

import { TRIP } from "./config.js";
import { esc, todayISO, shiftISO } from "./util.js";
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

function skyIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function readDaily(row) {
  const daily = {};
  const days = row.daily && row.daily.time ? row.daily.time : [];
  days.forEach((date, dayIndex) => {
    const high = row.daily.temperature_2m_max?.[dayIndex];
    const low = row.daily.temperature_2m_min?.[dayIndex];
    if (high == null || low == null) return;
    const rainMm = row.daily.precipitation_sum?.[dayIndex];
    daily[date] = {
      high: Math.round(high),
      low: Math.round(low),
      code: row.daily.weather_code?.[dayIndex],
      rainChance: row.daily.precipitation_probability_max?.[dayIndex],
      rainMm: rainMm == null ? null : Math.round(rainMm * 10) / 10,
    };
  });
  return daily;
}

async function fetchOpenMeteo(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("weather request failed");
  let payload = await response.json();
  return Array.isArray(payload) ? payload : [payload];
}

function venueQuery(venues) {
  const lats = venues.map((v) => v.lat).join(",");
  const lngs = venues.map((v) => v.lng).join(",");
  return `latitude=${lats}&longitude=${lngs}&timezone=${encodeURIComponent(TRIP.timezone)}`;
}

async function archiveDaily(venues, start, end) {
  if (!venues.length || !start || !end || start > end) return [];
  const url =
    `https://archive-api.open-meteo.com/v1/archive?${venueQuery(venues)}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum`;
  return fetchOpenMeteo(url);
}

export async function liveWeather() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.byCity;

  const venues = weatherVenues();
  if (!venues.length) return new Map();

  const today = todayISO(TRIP.timezone);
  const yesterday = shiftISO(today, -1);
  const zone = venueQuery(venues);

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?${zone}` +
    `&current=temperature_2m,weather_code,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,` +
    `precipitation_probability_max,precipitation_sum` +
    `&forecast_days=16&past_days=8`;

  try {
    const forecastRows = await fetchOpenMeteo(forecastUrl);
    let archiveRows = [];
    if (yesterday >= TRIP.start) {
      const from = TRIP.start;
      const to = yesterday < TRIP.end ? yesterday : TRIP.end;
      try {
        archiveRows = await archiveDaily(venues, from, to);
      } catch {
        archiveRows = [];
      }
    }

    const byCity = new Map();
    forecastRows.forEach((row, index) => {
      const venue = venues[index];
      if (!venue || !row.current) return;
      const daily = readDaily(row);
      const recorded = readDaily(archiveRows[index] || {});
      Object.assign(daily, recorded);
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

function observedPhrase(day) {
  let text = `${day.high}°C / ${day.low}°C, ${skyFor(day.code)}`;
  if (day.rainMm > 0) text += `, ${day.rainMm} mm of rain`;
  else if (day.rainMm === 0) text += `, no rain`;
  return text;
}

function forecastPhrase(day) {
  let text = `${day.high}°C / ${day.low}°C, ${skyFor(day.code)}`;
  if (day.rainChance != null) text += `, ${day.rainChance}% chance of rain`;
  return text;
}

export function weatherBoard() {
  const venues = weatherVenues();
  if (!venues.length) return "";

  return `
    <section>
      <h2 class="section-title">Weather Right Now</h2>
      <p class="measure muted">Live weather at each place we stay.</p>
      <div class="weather-now">
        ${venues
          .map(
            (v) => `<div class="weather-now__card" data-leg="${esc(v.leg)}"
                         data-live-city="${esc(v.city)}">
                      <p class="weather-now__place">
                        <span class="weather-now__icon" data-live-icon aria-hidden="true"></span>
                        ${esc(v.label)}
                      </p>
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

  const today = todayISO(TRIP.timezone);

  root.querySelectorAll("[data-live-city]").forEach((el) => {
    const snap = byCity.get(el.dataset.liveCity);
    if (!snap) return;

    const temp = el.querySelector("[data-live-temp]");
    const sky = el.querySelector("[data-live-sky]");
    const icon = el.querySelector("[data-live-icon]");
    if (temp) temp.textContent = `${snap.temp}°`;
    if (sky) sky.textContent = skyFor(snap.code);
    if (icon) icon.textContent = skyIcon(snap.code);

    const lineText = el.querySelector("[data-live-line-text]");
    if (!lineText) return;

    const date = el.dataset.liveDate;
    const day = date && snap.daily[date];
    let text = "";

    if (date && date < today && day) {
      text = `That day in ${snap.venue.label}: ${observedPhrase(day)}`;
    } else {
      text = `Now in ${snap.venue.label}: ${nowPhrase(snap)}`;
      if (day) text += `. This day ${forecastPhrase(day)}`;
    }

    lineText.textContent = text;
    el.hidden = false;
  });
}
