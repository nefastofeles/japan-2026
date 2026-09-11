/* ==========================================================================
   Writing memories
   --------------------------------------------------------------------------
   Admin posting goes through here so store.js can stay the read side.
   When the online album is connected, every write goes there. Saving on
   this phone only happens before Supabase is wired up — those posts never
   reach grandparents on another browser.
   ========================================================================== */

import { isConfigured } from "./config.js";
import { AlbumError, albumInsert } from "./album.js";
import { uploadImage } from "./media.js";
import { dayId } from "./store.js";
import {
  addLocalPhoto, addLocalVideo, addLocalStory, addLocalMeal,
} from "./local-posts.js";

async function requireDayId(day) {
  const id = await dayId(day);
  if (!id) throw new AlbumError("This day does not exist in the database yet.");
  return id;
}

export async function addBestOf(day, personId, body) {
  const id = await requireDayId(day);
  await albumInsert("entries", {
    day_id: id,
    person_id: personId,
    kind: "best",
    body,
  });
}

export async function addStory(day, personId, body) {
  if (!isConfigured()) {
    await addLocalStory(day, personId, body);
    return;
  }
  const id = await requireDayId(day);
  await albumInsert("entries", {
    day_id: id,
    person_id: personId,
    kind: "text",
    body,
  });
}

export async function addVideo(day, externalId, caption) {
  if (!isConfigured()) {
    await addLocalVideo(day, externalId, caption);
    return;
  }
  const id = await requireDayId(day);
  await albumInsert("media", {
    day_id: id,
    provider: "youtube",
    external_id: externalId,
    category: "other",
    caption: caption || null,
  });
}

export async function addPhoto(day, prepared, { category, place, mealId } = {}) {
  if (!isConfigured()) {
    return addLocalPhoto(day, prepared, { category, place, mealId });
  }
  const id = await requireDayId(day);
  return uploadImage(prepared, {
    dayId: id,
    dayDate: day.date || day.slug,
    category,
    place: place || null,
    mealId: mealId || null,
  });
}

export async function addMeal(day, { slot, placeName, priceYen, dishes, ratings, photos }) {
  if (!isConfigured()) {
    return addLocalMeal(day, { slot, placeName, priceYen, dishes, ratings, photos });
  }
  const id = await requireDayId(day);
  const meal = await albumInsert("meals", {
    day_id: id,
    slot,
    place_name: placeName || null,
    price_yen: priceYen || null,
    dishes,
  });
  if (ratings?.length) {
    await albumInsert(
      "meal_ratings",
      ratings.map((row) => ({ ...row, meal_id: meal.id }))
    );
  }
  for (const prepared of (photos || []).slice(0, 3)) {
    await addPhoto(day, prepared, {
      category: "food",
      place: placeName || null,
      mealId: meal.id,
    });
  }
  return meal.id;
}
