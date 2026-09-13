/* ==========================================================================
   Plan for the day
   --------------------------------------------------------------------------
   The itinerary in git is the preliminary plan. When a day arrives we
   reconfirm it in Admin; that adapted copy lives on this phone so a
   morning change does not wait on a pull request.
   ========================================================================== */

import { esc } from "../util.js";

const ADAPT_KEY = "japan-2026-day-plans";

function dayKey(day) {
  return day.date || day.slug;
}

function loadAdapted() {
  try {
    return JSON.parse(localStorage.getItem(ADAPT_KEY)) || {};
  } catch {
    return {};
  }
}

export function adaptedPlanFor(day) {
  const stored = loadAdapted()[dayKey(day)];
  return Array.isArray(stored) && stored.length ? stored : null;
}

export function saveAdaptedPlan(day, activities) {
  const all = loadAdapted();
  all[dayKey(day)] = activities;
  localStorage.setItem(ADAPT_KEY, JSON.stringify(all));
}

export function planForDay(day) {
  return adaptedPlanFor(day) || day.activities || [];
}

export function formatPlanText(activities) {
  return (activities || [])
    .map((block) => {
      const items = (block.items || []).map((item) => `- ${item}`).join("\n");
      return `${block.when}\n${items}`.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

/** A heading is a line that is not a dash-item. Blank lines split blocks. */
export function parsePlanText(text) {
  const blocks = [];
  let current = null;
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      current = null;
      continue;
    }
    if (line.startsWith("- ")) {
      if (!current) {
        current = { when: "Plan", items: [] };
        blocks.push(current);
      }
      current.items.push(line.slice(2).trim());
      continue;
    }
    current = { when: line, items: [] };
    blocks.push(current);
  }
  return blocks.filter((block) => block.items.length);
}

export function planBlocks(activities) {
  return (activities || [])
    .map(
      (block) => `
      <div class="block">
        <p class="block__when">${esc(block.when)}</p>
        <ul class="block__items">
          ${(block.items || []).map((item) => `<li>${esc(item)}</li>`).join("")}
        </ul>
      </div>`
    )
    .join("");
}

export function dayPlanSection(day) {
  const adapted = adaptedPlanFor(day);
  const activities = adapted || day.activities || [];
  const blocks = planBlocks(activities);
  if (!blocks) return "";

  const note = adapted
    ? `<p class="plan-note">Adapted on this phone when the day arrived.</p>`
    : `<p class="plan-note">Preliminary plan. Reconfirm and adapt it in Admin
         as soon as this day arrives.</p>`;

  return `<section>
            <h2 class="section-title">Plan for the day</h2>
            ${note}
            ${blocks}
          </section>`;
}

export function stayCard(stay) {
  if (!stay) return "";
  const lines = [
    stay.address,
    stay.phone && `Tel ${stay.phone}`,
    stay.checkIn && stay.checkOut && `Check-in ${stay.checkIn} · checkout ${stay.checkOut}`,
    stay.note,
  ].filter(Boolean);
  return `<section class="stay">
            <h2 class="section-title">Tonight</h2>
            <p class="stay__name">${esc(stay.name)}</p>
            <p class="small muted">Confirmed</p>
            ${lines.map((line) => `<p class="small">${esc(line)}</p>`).join("")}
          </section>`;
}
