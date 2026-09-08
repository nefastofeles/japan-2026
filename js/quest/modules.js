/**
 * Optional location modules inside a chapter.
 *
 * No required order. Core modules are always on. Others open by GPS,
 * a booked date, or a facilitator tap.
 */

import { TRIP } from "../config.js";
import { todayISO } from "../util.js";
import { saveState } from "./state.js";
import { gpsGate } from "./location.js";
import { queueQuestSync } from "./sync.js";

export function moduleById(quest, id) {
  return (quest.modules || []).find((item) => item.id === id) || null;
}

export function modulesForChapter(quest, chapterId) {
  return (quest.modules || []).filter((item) => item.chapterId === chapterId);
}

export function moduleEligible(module, state, { here, date } = {}) {
  if (!module) return true;
  if (!module.optional || module.activation === "core") return true;
  if ((state.activatedModules || []).includes(module.id)) return true;

  const day = date || todayISO(TRIP.timezone);
  // Before the trip, optional modules stay open so the family can rehearse.
  if (day < TRIP.start) return true;
  if (module.activation === "booking" && module.anchorDate === day) return true;

  if (module.location && (module.activation === "gps" || here)) {
    if (!here || here.error) return true;
    const gate = gpsGate(
      {
        location: {
          lat: module.location.lat,
          lng: module.location.lng,
          nearbyMeters: module.location.radiusMeters,
          unlockMeters: module.location.radiusMeters,
        },
      },
      here
    );
    return gate === "unlocked" || gate === "nearby";
  }

  if (module.activation === "facilitator") return false;
  return !module.optional;
}

export function activateModule(state, moduleId) {
  if (!state.activatedModules) state.activatedModules = [];
  if (!state.activatedModules.includes(moduleId)) {
    state.activatedModules.push(moduleId);
  }
  return queueQuestSync(state) || saveState(state);
}
