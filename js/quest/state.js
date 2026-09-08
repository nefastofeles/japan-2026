/**
 * Family quest progress, on this phone.
 *
 * Shared sync lives in sync.js. Until that backend exists, localStorage
 * is the whole game. Photos stay in IndexedDB because they do not fit
 * in JSON.
 */

const KEY = "japan-2026-quest";

function emptyState() {
  return {
    xp: 0,
    completed: {},
    discovered: [],
    badges: [],
    answers: {},
    memories: [],
  };
}

function asIdList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.keys(value);
  return [];
}

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (!parsed || typeof parsed !== "object") return emptyState();
    return {
      ...emptyState(),
      ...parsed,
      completed: parsed.completed || {},
      discovered: asIdList(parsed.discovered),
      badges: asIdList(parsed.badges),
      answers: parsed.answers || {},
      memories: parsed.memories || [],
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function isComplete(state, missionId) {
  return Boolean(state.completed[missionId]);
}

export function isDiscovered(state, codexId) {
  return state.discovered.includes(codexId);
}

export function hasBadge(state, badgeId) {
  return state.badges.includes(badgeId);
}
