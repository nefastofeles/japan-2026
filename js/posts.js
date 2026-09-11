/* ==========================================================================
   Writing memories
   --------------------------------------------------------------------------
   Admin posting goes through here so store.js can stay the read side.
   Until Supabase is on, the same functions save on this phone.
   ========================================================================== */

import { getClient } from "./supabase.js";
import { isConfigured } from "./config.js";
import { uploadImage } from "./media.js";
import { dayId } from "./store.js";
import {
  addLocalPhoto, addLocalVideo, addLocalStory, addLocalMeal,
} from "./local-posts.js";

export async function addBestOf(day, personId, body) {
  const id = await dayId(day);
  if (!id) throw new Error("This day does not exist in the database yet.");
  const supabase = await getClient();
  const { error } = await supabase
    .from("entries")
    .insert({ day_id: id, person_id: personId, kind: "best", body });
  if (error) throw error;
}

export async function addStory(day, personId, body) {
  if (!isConfigured()) {
    await addLocalStory(day, personId, body);
    return;
  }
  const id = await dayId(day);
  if (!id) throw new Error("This day does not exist in the database yet.");
  const supabase = await getClient();
  const { error } = await supabase.from("entries").insert({
    day_id: id,
    person_id: personId,
    kind: "text",
    body,
  });
  if (error) throw error;
}

export async function addVideo(day, externalId, caption) {
  if (!isConfigured()) {
    await addLocalVideo(day, externalId, caption);
    return;
  }
  const id = await dayId(day);
  if (!id) throw new Error("This day does not exist in the database yet.");
  const supabase = await getClient();
  const { error } = await supabase.from("media").insert({
    day_id: id,
    provider: "youtube",
    external_id: externalId,
    category: "other",
    caption: caption || null,
  });
  if (error) throw error;
}

export async function addPhoto(day, prepared, { category, place, mealId } = {}) {
  if (!isConfigured()) {
    return addLocalPhoto(day, prepared, { category, place, mealId });
  }
  const id = await dayId(day);
  if (!id) throw new Error("This day does not exist in the database yet.");
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
  const id = await dayId(day);
  if (!id) throw new Error("This day does not exist in the database yet.");
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("meals")
    .insert({
      day_id: id,
      slot,
      place_name: placeName || null,
      price_yen: priceYen || null,
      dishes,
    })
    .select("id")
    .single();
  if (error) throw error;
  if (ratings?.length) {
    await supabase.from("meal_ratings").insert(
      ratings.map((row) => ({ ...row, meal_id: data.id }))
    );
  }
  for (const prepared of (photos || []).slice(0, 3)) {
    await addPhoto(day, prepared, {
      category: "food",
      place: placeName || null,
      mealId: data.id,
    });
  }
  return data.id;
}
