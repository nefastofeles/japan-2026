/* ==========================================================================
   Reference blocks - the things that came out of the planning spreadsheets.
   --------------------------------------------------------------------------
   Weather is four years of daily observations (2022-2025) averaged per leg,
   which is far more useful than a seasonal average: it is what tells you that
   Kanazawa is the wet one and the Kiso valley mornings are the cold ones.
   ========================================================================== */

import { getReference } from "../store.js";
import { esc } from "../util.js";

export function weatherLine(legId) {
  const weather = getReference().weather || {};
  const w = weather[legId];
  if (!w) return "";

  return `
    <p class="transit">
      <span aria-hidden="true">🌤️</span>
      <span>Usually around <strong>${w.high}°C</strong> by day and
        <strong>${w.low}°C</strong> at night, rain ${esc(w.rain)}.
        <span class="muted">${esc(w.note)}</span>
      </span>
    </p>`;
}

export function watchlistSection() {
  const list = getReference().watchlist || [];
  if (!list.length) return "";

  const groups = [
    ["film", "Films"],
    ["series", "Series"],
    ["documentary", "Documentaries"],
  ];

  const body = groups
    .map(([kind, label]) => {
      const items = list.filter((i) => i.kind === kind);
      if (!items.length) return "";
      return `
        <h3>${esc(label)}</h3>
        <ul class="block__items">
          ${items
            .map(
              (i) => `<li><strong>${esc(i.title)}</strong>
                       <span class="muted">(${i.year})</span><br>
                       <span class="small">${esc(i.why)} · ${esc(i.where)}</span></li>`
            )
            .join("")}
        </ul>`;
    })
    .join("");

  return `<section>
            <h2 class="section-title">Watch before we go</h2>
            <p class="measure muted">One a week between now and the airport.</p>
            ${body}
          </section>`;
}

export function packingSection() {
  const reference = getReference();
  const packing = reference.packing || [];
  const apps = reference.apps || [];

  return `
    <section>
      <h2 class="section-title">Packing</h2>
      <ul class="block__items">
        ${packing.map((p) => `<li>${esc(p)}</li>`).join("")}
      </ul>
    </section>

    <section>
      <h2 class="section-title">Apps to install</h2>
      <ul class="meal__dishes">
        ${apps
          .map(
            (a) => `<li class="dish"><strong>${esc(a.name)}</strong>
                     <span class="dish__jp">${esc(a.for)}</span></li>`
          )
          .join("")}
      </ul>
    </section>`;
}

export function weatherTable() {
  const weather = getReference().weather || {};
  const entries = Object.entries(weather);
  if (!entries.length) return "";

  return `
    <section>
      <h2 class="section-title">What the weather usually does</h2>
      <p class="measure muted">
        Averaged from the last four years, day by day, for each place we stay.
      </p>
      <div class="stack">
        ${entries
          .map(
            ([leg, w]) => `
              <div class="card" data-leg="${esc(leg)}"
                   style="border-left:5px solid var(--leg)">
                <p><strong>${esc(leg[0].toUpperCase() + leg.slice(1))}</strong>
                   — ${w.high}°C / ${w.low}°C, rain ${esc(w.rain)}</p>
                <p class="small muted">${esc(w.note)}</p>
              </div>`
          )
          .join("")}
      </div>
    </section>`;
}
