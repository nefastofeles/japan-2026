/* ==========================================================================
   Food - every meal of the trip in one place.
   --------------------------------------------------------------------------
   A second view over the same data as the day pages. This is the page that
   turns a list of days into a collection, and it becomes "The Food Book" on
   the post-trip page.
   ========================================================================== */

import { allFood, getReference, getTravelDays } from "../store.js";
import { isConfigured } from "../config.js";
import { esc, yen, groupBy } from "../util.js";
import { mealCard } from "../components/meal-card.js";
import { averageScore } from "../components/rating-pips.js";

function hitList() {
  const reference = getReference();
  return `
    <section>
      <h2 class="section-title">The hit list</h2>
      <p class="measure muted">What we are hoping to eat in each place.</p>
      <div class="stack">
        ${reference.foodHitList
          .map(
            (row) => `<div class="card">
                        <p class="meal__place">${esc(row.city)}</p>
                        <p class="small">${esc(row.eat)}</p>
                      </div>`
          )
          .join("")}
      </div>
    </section>`;
}

export async function foodPage() {
  const meals = await allFood();

  if (!meals.length) {
    return `
      <div class="page stack">
        <h1>Food</h1>
        <p class="measure muted">
          Every meal, snack and konbini experiment of the trip will land here,
          rated out of five by all four of us.
        </p>
        ${
          !isConfigured()
            ? `<p class="notice"><strong>Plan mode.</strong> Connect Supabase to start logging meals.</p>`
            : `<p class="empty">Nothing logged yet.</p>`
        }
        ${hitList()}
      </div>`;
  }

  const withScores = meals.map((m) => ({ ...m, avg: averageScore(m.meal_ratings || []) }));
  const rated = withScores.filter((m) => m.avg !== null);
  const best = [...rated].sort((a, b) => b.avg - a.avg).slice(0, 5);
  const spent = meals.reduce((sum, m) => sum + (m.price_yen || 0), 0);

  const byCity = groupBy(
    withScores.filter((m) => m.days),
    (m) => m.days.city || "Elsewhere"
  );

  const cards = await Promise.all(withScores.map(mealCard));
  const cardByIndex = new Map(withScores.map((m, i) => [m.id, cards[i]]));

  const sections = [...byCity.entries()]
    .map(
      ([city, list]) => `
        <section data-leg="${esc(list[0].days.leg || "tokyo")}">
          <h2 class="section-title">${esc(city)}</h2>
          <div class="stack">${list.map((m) => cardByIndex.get(m.id)).join("")}</div>
        </section>`
    )
    .join("");

  return `
    <div class="page stack">
      <h1>Food</h1>

      <section class="stat-grid">
        <div class="stat"><span class="stat__n">${meals.length}</span>
          <span class="stat__l">meals logged</span></div>
        <div class="stat"><span class="stat__n">${getTravelDays().length}</span>
          <span class="stat__l">days</span></div>
        <div class="stat"><span class="stat__n">${esc(yen(spent) || "—")}</span>
          <span class="stat__l">spent on food</span></div>
      </section>

      ${
        best.length
          ? `<section>
               <h2 class="section-title">Top rated</h2>
               <ol>${best
                 .map(
                   (m) =>
                     `<li><strong>${esc(m.place_name || "Somewhere good")}</strong>
                      — ${m.avg} out of 5</li>`
                 )
                 .join("")}</ol>
             </section>`
          : ""
      }

      ${sections}
      ${hitList()}
    </div>`;
}
