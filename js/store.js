/* ==========================================================================
   Japan 2026 - data store
   --------------------------------------------------------------------------
   Two sources, deliberately kept apart:

     data/itinerary.json  the PLAN   - legs, dates, bookings, activities.
                                       Lives in git, editable in a pull
                                       request, present before the trip.
     Supabase             the MEMORIES - photos, videos, meals.
                                       Created during the trip.

   The plan is always available. The memories are only there once Supabase is
   configured. Until then, two days can show dress-rehearsal sample
   memories from data/mock-memories.json so we can see a full page.
   ========================================================================== */

import { getClient } from "./supabase.js";
import { isConfigured } from "./config.js";
import {
  mockMediaForDay, mockMealsForDay, mockEntriesForDay,
  mockBestOfForDay, mockAllMedia, mockAllFood, mocksEnabled,
} from "./mock-memories.js";
import {
  localMediaForDay, localEntriesForDay, localAllMedia,
  localMealsForDay, localAllMeals,
} from "./local-posts.js";

let itinerary = null;
let people = null;
let dayIdByDate = null;

/* --------------------------------------------------------------- the plan */

export async function load() {
  if (itinerary && people) return { itinerary, people };

  const [i, p] = await Promise.all([
    fetch("data/itinerary.json").then((r) => r.json()),
    fetch("data/people.json").then((r) => r.json()),
  ]);
  itinerary = i;
  people = p;
  return { itinerary, people };
}

export const getTrip = () => itinerary.trip;
export const getDays = () => itinerary.days;
export const getPeople = () => people;
export const getReference = () => itinerary.reference;

export const getPerson = (id) => people.find((p) => p.id === id) || null;

export const getLeg = (id) =>
  itinerary.legs.find((l) => l.id === id) || { id, name: id, colour: "#888" };

export const getTravelDays = () => itinerary.days.filter((d) => d.kind === "day");

/** Look a day up by date ("2026-09-18") or by slug ("before" / "after"). */
export function getDay(key) {
  return (
    itinerary.days.find((d) => d.date === key) ||
    itinerary.days.find((d) => d.slug === key) ||
    null
  );
}

export function neighbours(day) {
  const all = itinerary.days;
  const i = all.findIndex((d) => d.position === day.position);
  return { prev: all[i - 1] || null, next: all[i + 1] || null };
}

/** "Day 7 of 22" - only travel days are counted. */
export function dayNumber(day) {
  if (day.kind !== "day") return null;
  const travel = getTravelDays();
  return {
    n: travel.findIndex((d) => d.date === day.date) + 1,
    of: travel.length,
  };
}

/** Days grouped into consecutive legs, which is what the day strip renders. */
export function legGroups() {
  const groups = [];
  for (const day of itinerary.days) {
    const last = groups[groups.length - 1];
    if (last && last.leg === day.leg) last.days.push(day);
    else groups.push({ leg: day.leg, meta: getLeg(day.leg), days: [day] });
  }
  return groups;
}

/* ----------------------------------------------------------- the memories */

/** Maps "2026-09-18" to the Supabase row id, so media can be attached. */
async function dayIndex() {
  if (dayIdByDate) return dayIdByDate;
  dayIdByDate = new Map();

  const supabase = await getClient();
  if (!supabase) return dayIdByDate;

  const { data, error } = await supabase.from("days").select("id, date, slug, position");
  if (error) {
    console.warn("Could not load days:", error.message);
    return dayIdByDate;
  }
  for (const row of data) dayIdByDate.set(row.date || row.slug, row.id);
  return dayIdByDate;
}

export async function dayId(day) {
  const index = await dayIndex();
  return index.get(day.date || day.slug) || null;
}

async function query(table, build) {
  if (!isConfigured()) return [];
  const supabase = await getClient();
  if (!supabase) return [];
  const { data, error } = await build(supabase.from(table));
  if (error) {
    console.warn(`Could not load ${table}:`, error.message);
    return [];
  }
  return data || [];
}

function attachDay(item) {
  const day = getDay(item.day);
  return {
    ...item,
    days: day ? { date: day.date, city: day.city, leg: day.leg } : null,
  };
}

export async function mediaForDay(day) {
  const local = await localMediaForDay(day);
  if (mocksEnabled()) return [...(await mockMediaForDay(day)), ...local];
  const id = await dayId(day);
  if (!id) return local;
  const remote = await query("media", (t) =>
    t.select("*").eq("day_id", id).order("taken_at", { ascending: true, nullsFirst: false })
  );
  return [...remote, ...local];
}

export async function mealsForDay(day) {
  const local = await localMealsForDay(day);
  if (mocksEnabled()) return [...(await mockMealsForDay(day)), ...local];
  const id = await dayId(day);
  if (!id) return local;
  const meals = await query("meals", (t) =>
    t.select("*, meal_ratings(*)").eq("day_id", id).order("created_at")
  );
  if (!meals.length) return local;

  const mediaByMeal = new Map();
  const shots = await query("media", (t) =>
    t.select("*").in("meal_id", meals.map((m) => m.id))
  );
  for (const shot of shots) {
    if (!mediaByMeal.has(shot.meal_id)) mediaByMeal.set(shot.meal_id, []);
    mediaByMeal.get(shot.meal_id).push(shot);
  }
  return [
    ...meals.map((m) => ({ ...m, media: mediaByMeal.get(m.id) || [] })),
    ...local,
  ];
}

export async function entriesForDay(day) {
  const local = await localEntriesForDay(day);
  if (mocksEnabled()) return [...(await mockEntriesForDay(day)), ...local];
  const id = await dayId(day);
  if (!id) return local;
  const remote = await query("entries", (t) => t.select("*").eq("day_id", id).order("position"));
  return [...remote, ...local];
}

export async function bestOfForDay(day) {
  if (mocksEnabled()) return mockBestOfForDay(day);
  const id = await dayId(day);
  if (!id) return [];
  const rows = await query("entries", (t) =>
    t.select("*").eq("day_id", id).eq("kind", "best")
  );
  return rows.filter((row) => row.person_id && row.body);
}

export async function allFood() {
  const local = await localAllMeals();
  if (mocksEnabled()) {
    const meals = await mockAllFood();
    return [...meals, ...local].map(attachDay);
  }
  const remote = await query("meals", (t) =>
    t.select("*, meal_ratings(*), days(date, city, leg)").order("created_at")
  );
  return [...remote, ...local.map(attachDay)];
}

export async function allMedia({ limit = 500 } = {}) {
  const local = await localAllMedia();
  if (mocksEnabled()) {
    const media = await mockAllMedia({ limit });
    return [...media, ...local].map(attachDay);
  }
  // days.cover_media_id also points at media, so PostgREST will not
  // guess `days(...)` and the Photos page would come back empty.
  const remote = await query("media", (t) =>
    t.select("*, days!media_day_id_fkey(date, city, leg)")
      .order("taken_at", { ascending: false, nullsFirst: false })
      .limit(limit)
  );
  return [...remote, ...local.map(attachDay)];
}

export async function addReaction(targetType, targetId, emoji) {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.from("reactions").insert({
    target_type: targetType,
    target_id: targetId,
    emoji,
  });
}
