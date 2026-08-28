/* ==========================================================================
   Rating pips - how each person scored a dish, out of five.
   --------------------------------------------------------------------------
   Ratings belong to PEOPLE, not to accounts, so Leo can score a bowl of ramen
   from his dad's phone without owning an email address.

   Leo: these are larger circles now so they are easy to count. They could
   still become chopsticks, or onigiri, or little bowls. Look for .pip.
   ========================================================================== */

import { esc } from "../util.js";
import { getPerson } from "../store.js";

export function pips(score, max = 5) {
  let out = '<span class="pips" aria-hidden="true">';
  for (let i = 1; i <= max; i += 1) {
    out += `<span class="pip${i <= score ? " pip--on" : ""}"></span>`;
  }
  return out + "</span>";
}

export function ratingRow(rating) {
  const person = getPerson(rating.person_id);
  const name = person ? person.name : rating.person_id;
  const colour = person ? person.colour : "#6B6660";
  const initial = person ? person.short || person.name[0] : "?";

  return `
    <span class="rating" title="${esc(name)} gave this ${rating.score} out of 5">
      <span class="rating__who" style="--person:${esc(colour)}">${esc(initial)}</span>
      ${pips(rating.score)}
      <span class="visually-hidden">${esc(name)}: ${rating.score} out of 5</span>
    </span>`;
}

export function ratings(list = []) {
  if (!list.length) return "";
  const ordered = [...list].sort((a, b) =>
    String(a.person_id).localeCompare(String(b.person_id))
  );
  return `<div class="ratings">${ordered.map(ratingRow).join("")}</div>`;
}

export function averageScore(list = []) {
  if (!list.length) return null;
  const total = list.reduce((sum, r) => sum + r.score, 0);
  return Math.round((total / list.length) * 10) / 10;
}
