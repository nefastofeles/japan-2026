/**
 * Family quest progress, on this phone.
 *
 * One family, one private URL. Supabase is not wired yet, so localStorage
 * is enough. Photos live in IndexedDB because they do not fit in JSON.
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

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (!parsed || typeof parsed !== "object") return emptyState();
    return {
      ...emptyState(),
      ...parsed,
      completed: parsed.completed || {},
      discovered: parsed.discovered || [],
      badges: parsed.badges || [],
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
