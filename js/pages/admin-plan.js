/* ==========================================================================
   Admin — Plan for the day
   --------------------------------------------------------------------------
   Shows the preliminary plan from the itinerary. Saving an adaptation
   updates the day page on this phone so a morning change is immediate.
   ========================================================================== */

import { getStay } from "../store.js";
import { esc } from "../util.js";
import {
  adaptedPlanFor, formatPlanText, parsePlanText, planForDay,
  saveAdaptedPlan, stayCard,
} from "../components/day-plan.js";

export function adminPlanMarkup() {
  return `
    <section class="card stack">
      <h2 class="section-title">Plan for the day</h2>
      <p class="small muted">
        This is the preliminary plan. Reconfirm and adapt it as soon as
        the day arrives. A save on this phone updates that day's page.
      </p>
      <div data-plan-stay></div>
      <div data-plan-preview></div>
      <div>
        <label for="dayplan">Adapt the plan</label>
        <textarea class="field" id="dayplan" rows="14" data-dayplan
                  placeholder="Morning&#10;- First thing&#10;&#10;Afternoon&#10;- Next thing"></textarea>
      </div>
      <button class="btn" type="button" data-saveplan>Save the adapted plan</button>
      <p class="small" data-plan-status role="status"></p>
    </section>`;
}

export function refreshAdminPlan(root, day) {
  const preview = root.querySelector("[data-plan-preview]");
  const stayMount = root.querySelector("[data-plan-stay]");
  const field = root.querySelector("[data-dayplan]");
  const status = root.querySelector("[data-plan-status]");
  if (!preview || !field) return;

  const activities = planForDay(day);
  preview.innerHTML = activities.length
    ? activities
        .map(
          (block) => `<div class="block">
             <p class="block__when">${esc(block.when)}</p>
             <ul class="block__items">
               ${(block.items || []).map((item) => `<li>${esc(item)}</li>`).join("")}
             </ul>
           </div>`
        )
        .join("")
    : `<p class="empty">No plan written for this day yet.</p>`;
  if (stayMount) stayMount.innerHTML = stayCard(getStay(day));
  field.value = formatPlanText(activities);
  if (status) {
    status.textContent = adaptedPlanFor(day)
      ? "Showing the adapted plan saved on this phone."
      : "Showing the preliminary plan from the itinerary.";
  }
}

export function bindAdminPlan(root, selectedDay) {
  refreshAdminPlan(root, selectedDay());
  root.querySelector("[data-day]")?.addEventListener("change", () => {
    refreshAdminPlan(root, selectedDay());
  });
  root.querySelector("[data-saveplan]")?.addEventListener("click", () => {
    const day = selectedDay();
    const field = root.querySelector("[data-dayplan]");
    const status = root.querySelector("[data-plan-status]");
    const activities = parsePlanText(field?.value || "");
    if (!activities.length) {
      if (status) status.textContent = "Write at least one section with a dashed item.";
      return;
    }
    saveAdaptedPlan(day, activities);
    refreshAdminPlan(root, day);
    if (status) {
      status.textContent = "Adapted plan saved on this phone. Open the day page to see it.";
    }
  });
}
