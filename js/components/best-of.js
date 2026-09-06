/* ==========================================================================
   The best of the day
   --------------------------------------------------------------------------
   Four short notes, one from each of us. Text only. The highlighted box
   sits under the story so a grandparent can read the day's favourite
   thing without scrolling the whole journal.
   ========================================================================== */

import { getPeople } from "../store.js";
import { esc } from "../util.js";

export function bestOfSection(notes) {
  const byPerson = new Map((notes || []).map((n) => [n.person_id, n.body]));

  const cards = getPeople()
    .map((person) => {
      const body = (byPerson.get(person.id) || "").trim();
      return `
        <div class="best-of__card" style="--person:${esc(person.colour)}">
          <p class="best-of__who">${esc(person.name)}</p>
          ${
            body
              ? `<p class="best-of__body">${esc(body)}</p>`
              : `<p class="best-of__body muted">Not written yet.</p>`
          }
        </div>`;
    })
    .join("");

  return `
    <aside class="best-of">
      <h3 class="best-of__title">The best of the day</h3>
      <div class="best-of__grid">${cards}</div>
    </aside>`;
}
