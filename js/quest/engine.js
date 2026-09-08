/**
 * Mission rules: what is open, what completing does.
 *
 * Dates come from the itinerary via chapter start/end. GPS is optional.
 * Before the trip we still allow sample missions so the family can try
 * the engine this week. XP on screen is derived from completions so
 * two phones cannot double-count the same page.
 */

import { TRIP } from "../config.js";
import { todayISO } from "../util.js";
import { loadState, isComplete, isDiscovered } from "./state.js";
import { queueQuestSync } from "./sync.js";
import { gpsGate } from "./location.js";

export function isMemoryMode(chapter, mission) {
  return Boolean(mission?.sensitive || chapter?.tone === "memory");
}

export function memoryPlace(quest, mission) {
  const list = quest.missions.filter((item) => item.chapterId === mission.chapterId);
  const index = list.findIndex((item) => item.id === mission.id);
  return { index: index + 1, total: list.length };
}

export function familyXp(quest, state) {
  if (!quest) return state.xp || 0;
  let xp = 0;
  for (const id of Object.keys(state.completed || {})) {
    const mission = quest.missions.find((item) => item.id === id);
    if (mission) xp += mission.xp || 0;
  }
  const paidByMission = new Set();
  for (const mission of quest.missions) {
    if (!state.completed[mission.id]) continue;
    if (mission.codexUnlock) paidByMission.add(mission.codexUnlock);
    for (const extra of mission.unlockDiscoveries || []) paidByMission.add(extra);
  }
  for (const id of state.discovered || []) {
    if (paidByMission.has(id)) continue;
    const discovery = (quest.discoveries || []).find(
      (item) => item.id === id || item.codexId === id
    );
    if (discovery) xp += discovery.xp || 0;
  }
  return xp;
}

export function tripProgress(quest, state) {
  const total = quest.missions.length;
  const done = Object.keys(state.completed).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function currentChapter(quest, date = todayISO(TRIP.timezone)) {
  if (date < TRIP.start) return quest.chapters[0];
  const live = quest.chapters.find(
    (chapter) => date >= chapter.startDate && date <= chapter.endDate
  );
  if (live) return live;
  if (date > TRIP.end) return quest.chapters[quest.chapters.length - 1];
  return quest.chapters[0];
}

export function nextChapter(quest, chapter) {
  const index = quest.chapters.findIndex((item) => item.id === chapter.id);
  return quest.chapters[index + 1] || null;
}

function prereqsMet(mission, state) {
  return (mission.requiresMission || []).every((id) => isComplete(state, id));
}

export function chapterComplete(quest, state, chapterId) {
  const list = quest.missions.filter((mission) => mission.chapterId === chapterId);
  if (!list.length) return false;
  return list.every((mission) => isComplete(state, mission.id));
}

export function missionStatus(mission, state, { here, date } = {}) {
  if (isComplete(state, mission.id)) return "done";
  if (!prereqsMet(mission, state)) return "locked";
  const gate = gpsGate(mission, here);
  if (gate === "locked") return "locked";
  if (gate === "nearby") return "nearby";
  if (mission.date && date && date !== mission.date && date >= TRIP.start) {
    return "scheduled";
  }
  return "open";
}

export function todaysMissions(quest, state, chapter, date) {
  return quest.missions.filter((mission) => {
    if (mission.chapterId !== chapter.id) {
      return mission.date === date && !isComplete(state, mission.id);
    }
    return !isComplete(state, mission.id);
  });
}

export function openDiscoveries(quest, state, chapter) {
  return (quest.discoveries || []).filter((item) => {
    if (!item.findable) return false;
    const id = item.codexId || item.id;
    if (isDiscovered(state, id)) return false;
    if (item.chapterId && chapter && item.chapterId !== chapter.id) return false;
    return true;
  });
}

function unlockBadges(quest, state, mission) {
  const add = (id) => {
    if (id && !state.badges.includes(id)) state.badges.push(id);
  };
  add(mission.badgeUnlock);
  if (mission.id === "tokyo-konbini") add("konbini-explorer");
  if (state.discovered.includes("kitsune")) add("yokai-hunter");
  const foodDone = quest.missions.filter(
    (item) => item.type === "food" && isComplete(state, item.id)
  ).length;
  if (foodDone >= 1) add("food-explorer");
}

function persist(quest, state) {
  state.xp = familyXp(quest, state);
  return queueQuestSync(state);
}

export function completeMission(quest, state, mission, payload = {}) {
  if (isComplete(state, mission.id)) return state;
  if (!(mission.requiresMission || []).every((id) => isComplete(state, id))) {
    return state;
  }

  const date = payload.date || todayISO(TRIP.timezone);
  state.completed[mission.id] = {
    at: new Date().toISOString(),
    date,
    participants: payload.participants || [],
    completedBy: payload.completedBy || (payload.participants || [])[0] || "",
    answer: payload.answer || "",
    photoId: payload.photoId || null,
    summary: payload.summary || mission.title,
  };

  if (payload.answer) state.answers[mission.id] = payload.answer;
  if (mission.callbackKey && payload.answer) {
    state.answers[mission.callbackKey] = payload.answer;
  }

  const unlocks = [
    mission.codexUnlock,
    ...(mission.unlockDiscoveries || []),
  ].filter(Boolean);
  for (const id of unlocks) {
    if (!state.discovered.includes(id)) state.discovered.push(id);
  }

  unlockBadges(quest, state, mission);

  state.memories.push({
    date,
    location: payload.locationLabel || mission.location?.label || "",
    chapterId: mission.chapterId,
    missionId: mission.id,
    participants: payload.participants || [],
    summary: payload.summary || mission.title,
    photoId: payload.photoId || null,
    answer: payload.answer || "",
    interestingMoment: payload.interestingMoment || "",
  });

  return persist(quest, state);
}

export function collectDiscovery(quest, state, discovery, payload = {}) {
  const id = discovery.codexId || discovery.id;
  if (isDiscovered(state, id)) return state;

  const date = payload.date || todayISO(TRIP.timezone);
  state.discovered.push(id);
  state.memories.push({
    date,
    location: discovery.locationLabel || "",
    chapterId: discovery.chapterId || "",
    missionId: "",
    discoveryId: discovery.id,
    participants: payload.participants || [],
    summary: discovery.name || discovery.hook || discovery.id,
    answer: payload.answer || "",
  });
  return persist(quest, state);
}

export function previousAnswer(state, mission) {
  if (!mission.callbackFrom) return "";
  const prior = state.completed[mission.callbackFrom];
  return (prior && prior.answer) || state.answers[mission.callbackFrom] || "";
}

export function defaultState() {
  return loadState();
}
