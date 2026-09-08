/* ==========================================================================
   Posts saved on this phone
   --------------------------------------------------------------------------
   Until Supabase is wired up, photos, story text and YouTube links stay in
   IndexedDB / localStorage on the device that posted them. They are not a
   substitute for the database — grandparents on another phone will not see
   them — but they let Admin work before the backend exists.
   ========================================================================== */

const META_KEY = "japan-2026-local-posts";
const DB_NAME = "japan-2026-posts";
const blobUrls = new Map();

function dayKey(day) {
  return day.date || day.slug;
}

function loadMeta() {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_KEY)) || {};
    return {
      photos: parsed.photos || [],
      videos: parsed.videos || [],
      entries: parsed.entries || [],
      meals: parsed.meals || [],
    };
  } catch {
    return { photos: [], videos: [], entries: [], meals: [] };
  }
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function newId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("blobs")) {
        request.result.createObjectStore("blobs");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putBlobs(id, value) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getBlobs(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blobs", "readonly");
    const request = tx.objectStore("blobs").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function blobUrl(id, kind, blob) {
  const key = `${id}:${kind}`;
  if (!blobUrls.has(key)) blobUrls.set(key, URL.createObjectURL(blob));
  return blobUrls.get(key);
}

function asPhoto(item, blobs) {
  return {
    ...item,
    provider: "local",
    thumb_path: blobUrl(item.id, "thumb", blobs.thumb),
    storage_path: blobUrl(item.id, "full", blobs.full || blobs.thumb),
  };
}

function asVideo(item) {
  return { ...item, provider: "youtube", category: "other" };
}

export async function addLocalPhoto(day, prepared, { category, place, mealId } = {}) {
  const id = newId();
  await putBlobs(id, { full: prepared.full, thumb: prepared.thumb });

  const meta = loadMeta();
  if (!meta.meals) meta.meals = [];
  meta.photos.push({
    id,
    day: dayKey(day),
    category: category || (mealId ? "food" : "place"),
    place: place || null,
    meal_id: mealId || null,
    taken_at: prepared.takenAt || null,
    lat: prepared.lat ?? null,
    lng: prepared.lng ?? null,
  });
  saveMeta(meta);
  return id;
}

export async function addLocalVideo(day, externalId, caption) {
  const meta = loadMeta();
  meta.videos.push({
    id: newId(),
    day: dayKey(day),
    external_id: externalId,
    caption: caption || null,
  });
  saveMeta(meta);
}

export async function addLocalStory(day, personId, body) {
  const meta = loadMeta();
  meta.entries.push({
    id: newId(),
    day: dayKey(day),
    person_id: personId || null,
    kind: "text",
    position: meta.entries.length + 1,
    body,
  });
  saveMeta(meta);
}

export async function localMediaForDay(day) {
  const key = dayKey(day);
  const meta = loadMeta();
  const photos = [];
  for (const item of meta.photos.filter((row) => row.day === key)) {
    const blobs = await getBlobs(item.id);
    if (blobs?.thumb) photos.push(asPhoto(item, blobs));
  }
  const videos = meta.videos.filter((item) => item.day === key).map(asVideo);
  return [...photos, ...videos];
}

export async function localEntriesForDay(day) {
  return loadMeta().entries.filter((item) => item.day === dayKey(day));
}

export async function addLocalMeal(day, { slot, placeName, priceYen, dishes, ratings, photos }) {
  const id = newId();
  const meta = loadMeta();
  meta.meals.push({
    id,
    day: dayKey(day),
    slot,
    place_name: placeName || null,
    price_yen: priceYen || null,
    dishes: dishes || [],
    meal_ratings: ratings || [],
  });
  saveMeta(meta);

  for (const prepared of (photos || []).slice(0, 3)) {
    await addLocalPhoto(day, prepared, {
      category: "food",
      place: placeName || null,
      mealId: id,
    });
  }
  return id;
}

function mealsWithPhotos(meals, photos) {
  return meals.map((meal) => ({
    ...meal,
    media: photos.filter((item) => item.meal_id === meal.id),
  }));
}

export async function localMealsForDay(day) {
  const key = dayKey(day);
  const media = await localMediaForDay(day);
  return mealsWithPhotos(
    loadMeta().meals.filter((meal) => meal.day === key),
    media
  );
}

export async function localAllMeals() {
  const media = await localAllMedia();
  return mealsWithPhotos(loadMeta().meals, media);
}

export async function localAllMedia() {
  const meta = loadMeta();
  const photos = [];
  for (const item of meta.photos) {
    const blobs = await getBlobs(item.id);
    if (blobs?.thumb) photos.push(asPhoto(item, blobs));
  }
  return [...photos, ...meta.videos.map(asVideo)];
}
