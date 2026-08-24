/* ==========================================================================
   Meal card
   --------------------------------------------------------------------------
   Food is a first-class record, not a paragraph with photos underneath. That
   is what makes the post-trip food book possible: best dish per city, the
   ramen leaderboard, the most divisive meal, all of it just queries over
   data collected because rating things was fun.
   ========================================================================== */

import { esc, yen } from "../util.js";
import { ratings, averageScore } from "./rating-pips.js";
import { photoGrid } from "./photo-grid.js";

const SLOT_LABEL = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  konbini: "Konbini",
};

export async function mealCard(meal) {
  const dishes = Array.isArray(meal.dishes) ? meal.dishes : [];
  const average = averageScore(meal.meal_ratings || []);

  const dishList = dishes.length
    ? `<ul class="meal__dishes">${dishes
        .map(
          (d) => `<li class="dish">${esc(d.en || d.name || "")}${
            d.jp ? `<span class="dish__jp jp">${esc(d.jp)}</span>` : ""
          }</li>`
        )
        .join("")}</ul>`
    : "";

  const place = meal.place_url
    ? `<a class="meal__place" href="${esc(meal.place_url)}" target="_blank" rel="noopener">${esc(
        meal.place_name || "Somewhere good"
      )}</a>`
    : `<span class="meal__place">${esc(meal.place_name || "Somewhere good")}</span>`;

  const photos = meal.media && meal.media.length ? await photoGrid(meal.media) : "";

  return `
    <article class="meal">
      <header class="meal__head">
        <span class="meal__slot">${esc(SLOT_LABEL[meal.slot] || meal.slot)}</span>
        ${place}
        ${meal.price_yen ? `<span class="meal__price">${esc(yen(meal.price_yen))}</span>` : ""}
      </header>
      ${dishList}
      ${meal.notes ? `<p class="small">${esc(meal.notes)}</p>` : ""}
      ${ratings(meal.meal_ratings || [])}
      ${average !== null ? `<p class="xs muted">Family average ${average} out of 5</p>` : ""}
      ${photos}
    </article>`;
}

export async function mealList(meals) {
  if (!meals.length) {
    return `<p class="empty">No meals logged yet. They will appear here as we eat our way across Japan.</p>`;
  }
  const cards = await Promise.all(meals.map(mealCard));
  return `<div class="stack">${cards.join("")}</div>`;
}
