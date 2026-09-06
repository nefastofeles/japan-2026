/* ==========================================================================
   Dress-rehearsal memories
   --------------------------------------------------------------------------
   Loaded only when Supabase is not set up. Two days have sample photos,
   meals and comments so we can see how a full page looks. They are labelled
   on the page: these are not our pictures.
   ========================================================================== */

import { isConfigured, USE_MOCK_MEMORIES } from "./config.js";

let cache = null;

export function mocksEnabled() {
  return USE_MOCK_MEMORIES && !isConfigured();
}

export async function loadMocks() {
  if (!mocksEnabled()) return null;
  if (cache) return cache;
  const response = await fetch("data/mock-memories.json");
  if (!response.ok) return null;
  cache = await response.json();
  return cache;
}

function dayKey(day) {
  return day.date || day.slug;
}

export async function dayHasMockMemories(day) {
  const data = await loadMocks();
  if (!data) return false;
  return (data.days || []).includes(dayKey(day));
}

export async function mockMediaForDay(day) {
  const data = await loadMocks();
  if (!data) return [];
  return (data.media || []).filter((item) => item.day === dayKey(day));
}

export async function mockMealsForDay(day) {
  const data = await loadMocks();
  if (!data) return [];
  const key = dayKey(day);
  const meals = (data.meals || []).filter((meal) => meal.day === key);
  const shots = (data.media || []).filter((item) => item.meal_id);
  return meals.map((meal) => ({
    ...meal,
    media: shots.filter((item) => item.meal_id === meal.id),
  }));
}

export async function mockEntriesForDay(day) {
  const data = await loadMocks();
  if (!data) return [];
  return (data.entries || [])
    .filter((item) => item.day === dayKey(day))
    .sort((a, b) => (a.position || 0) - (b.position || 0));
}

export async function mockCommentsForDay(day) {
  const data = await loadMocks();
  if (!data) return [];
  return (data.comments || []).filter((item) => item.day === dayKey(day));
}

export async function mockAllMedia({ limit = 500 } = {}) {
  const data = await loadMocks();
  if (!data) return [];
  return (data.media || [])
    .sort((a, b) => String(b.taken_at || "").localeCompare(String(a.taken_at || "")))
    .slice(0, limit);
}

export async function mockAllFood() {
  const data = await loadMocks();
  if (!data) return [];
  const shots = (data.media || []).filter((item) => item.meal_id);
  return (data.meals || []).map((meal) => ({
    ...meal,
    media: shots.filter((item) => item.meal_id === meal.id),
  }));
}
