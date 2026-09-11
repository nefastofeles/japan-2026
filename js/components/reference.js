/* ==========================================================================
   Reference blocks - the things that came out of the planning spreadsheets.
   --------------------------------------------------------------------------
   Weather is four years of daily observations (2022-2025) averaged per leg,
   which is far more useful than a seasonal average: it is what tells you that
   Kanazawa is the wet one and the Kiso valley mornings are the cold ones.
   ========================================================================== */

import { getReference } from "../store.js";
import { esc } from "../util.js";
import { cityForLeg, liveWeatherLine } from "../weather.js";
import { PLACES } from "../places.js";

export function weatherLine(day) {
  const weather = getReference().weather || {};
  const w = weather[day.leg];
  // Transit labels like "Copenhagen to Tokyo" are not weather stations.
  const city = PLACES[day.city] ? day.city : cityForLeg(day.leg);
  const live = liveWeatherLine(city, day.date);
  if (!w && !live) return "";

  const usual = w
    ? `<p class="transit">
         <span aria-hidden="true">🌤️</span>
         <span>Usually around <strong>${w.high}°C</strong> by day and
           <strong>${w.low}°C</strong> at night, rain ${esc(w.rain)}.
           <span class="muted">${esc(w.note)}</span>
         </span>
       </p>`
    : "";

  return live + usual;
}

export function weatherTable() {
  const weather = getReference().weather || {};
  const entries = Object.entries(weather);
  if (!entries.length) return "";

  return `
    <section>
      <h2 class="section-title">What the weather usually does</h2>
      <p class="measure muted">
        Averaged from the last four years, plus what it is doing there right now.
      </p>
      <div class="stack">
        ${entries
          .map(([leg, w]) => {
            const city = cityForLeg(leg);
            return `
              <div class="card" data-leg="${esc(leg)}"
                   style="border-left:5px solid var(--leg)">
                <p><strong>${esc(leg[0].toUpperCase() + leg.slice(1))}</strong>
                   — usually ${w.high}°C / ${w.low}°C, rain ${esc(w.rain)}</p>
                ${liveWeatherLine(city, "")}
                <p class="small muted">${esc(w.note)}</p>
              </div>`;
          })
          .join("")}
      </div>
    </section>`;
}
