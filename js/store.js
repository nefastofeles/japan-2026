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

import { isConfigured } from "./config.js";
import { AlbumError, albumGet, albumInsert } from "./album.js";
import {
  mockMediaForDay, mockMealsForDay, mockEntriesForDay,
  mockBestOfForDay, mockAllMedia, mockAllFood, mocksEnabled,
} from "./mock-memories.js";
import {
  localMediaForDay, localEntriesForDay, localAllMedia,
  localMealsForDay, localAllMeals,
  localVideos, localVideosForDay,
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

/** Maps "2026-09-18" and "before" to the Supabase row id. */
async function dayIndex() {
  if (dayIdByDate) return dayIdByDate;
  if (!isConfigured()) return new Map();

  // Do not cache an empty map on failure — the next read must retry.
  const rows = await albumGet("days", "select=id,date,slug,position");
  const index = new Map();
  for (const row of rows) {
    if (row.date) index.set(row.date, row.id);
    if (row.slug) index.set(row.slug, row.id);
  }
  dayIdByDate = index;
  return index;
}

export async function dayId(day) {
  const index = await dayIndex();
  return index.get(day.date) || index.get(day.slug) || null;
}

async function requireDayId(day) {
  const id = await dayId(day);
  if (!id) throw new AlbumError("This day is missing from the online album.");
  return id;
}

async function localOnly(loader) {
  if (mocksEnabled()) return loader();
  if (!isConfigured()) return loader();
  return null;
}

function attachDay(item) {
  const day = getDay(item.day);
  return {
    ...item,
    days: day ? { date: day.date, city: day.city, leg: day.leg } : null,
  };
}

function youtubeKey(item) {
  return item?.provider === "youtube" && item.external_id
    ? item.external_id
    : "";
}

// YouTube rows are just an id and a caption, not a private photo blob.
// Keep phone-local clips on the boards after the shared album is on, so
// a storage wipe cannot hide a link that is still on this phone.
function withLocalYoutube(remote, extras) {
  const seen = new Set(remote.map(youtubeKey).filter(Boolean));
  const extra = [];
  for (const item of extras || []) {
    const key = youtubeKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    extra.push(item);
  }
  return extra.length ? [...remote, ...extra] : remote;
}

export async function mediaForDay(day) {
  const local = await localOnly(() => localMediaForDay(day));
  if (local) {
    if (mocksEnabled()) return [...(await mockMediaForDay(day)), ...local];
    return local;
  }
  const id = await requireDayId(day);
  const remote = await albumGet(
    "media",
    `select=*&day_id=eq.${encodeURIComponent(id)}&order=taken_at.asc.nullslast`
  );
  return withLocalYoutube(remote, localVideosForDay(day));
}

export async function mealsForDay(day) {
  const local = await localOnly(() => localMealsForDay(day));
  if (local) {
    if (mocksEnabled()) return [...(await mockMealsForDay(day)), ...local];
    return local;
  }
  const id = await requireDayId(day);
  const meals = await albumGet(
    "meals",
    `select=*,meal_ratings(*)&day_id=eq.${encodeURIComponent(id)}&order=created_at.asc`
  );
  if (!meals.length) return [];

  const mediaByMeal = new Map();
  const shots = await albumGet(
    "media",
    `select=*&meal_id=in.(${meals.map((m) => m.id).join(",")})`
  );
  for (const shot of shots) {
    if (!mediaByMeal.has(shot.meal_id)) mediaByMeal.set(shot.meal_id, []);
    mediaByMeal.get(shot.meal_id).push(shot);
  }
  return meals.map((m) => ({ ...m, media: mediaByMeal.get(m.id) || [] }));
}

export async function entriesForDay(day) {
  const local = await localOnly(() => localEntriesForDay(day));
  if (local) {
    if (mocksEnabled()) return [...(await mockEntriesForDay(day)), ...local];
    return local;
  }
  const id = await requireDayId(day);
  return albumGet(
    "entries",
    `select=*&day_id=eq.${encodeURIComponent(id)}&order=position.asc`
  );
}

export async function bestOfForDay(day) {
  if (mocksEnabled()) return mockBestOfForDay(day);
  if (!isConfigured()) return [];
  const id = await requireDayId(day);
  const rows = await albumGet(
    "entries",
    `select=*&day_id=eq.${encodeURIComponent(id)}&kind=eq.best`
  );
  return rows.filter((row) => row.person_id && row.body);
}

export async function allFood() {
  const local = await localOnly(() => localAllMeals());
  if (local) {
    if (mocksEnabled()) {
      const meals = await mockAllFood();
      return [...meals, ...local].map(attachDay);
    }
    return local.map(attachDay);
  }
  const remote = await albumGet(
    "meals",
    "select=*,meal_ratings(*),days(date,city,leg)&order=created_at.asc"
  );
  return remote;
}

export async function allMedia({ limit = 500 } = {}) {
  const local = await localOnly(() => localAllMedia());
  if (local) {
    if (mocksEnabled()) {
      const media = await mockAllMedia({ limit });
      return [...media, ...local].map(attachDay);
    }
    return local.map(attachDay);
  }
  const remote = await albumGet(
    "media",
    `select=*&order=taken_at.desc.nullslast&limit=${Number(limit) || 500}`
  );
  return withLocalYoutube(remote, localVideos().map(attachDay));
}

export async function addReaction(targetType, targetId, emoji) {
  if (!isConfigured()) return;
  await albumInsert("reactions", {
    target_type: targetType,
    target_id: targetId,
    emoji,
  });
}
