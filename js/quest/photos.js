/**
 * Mission photos, kept on this phone.
 *
 * Reuses the same compression as the journal so a quest snap is not a
 * full-size iPhone file. Other devices will not see these until a
 * database exists.
 */

import { prepareImage } from "../media.js";

const DB_NAME = "japan-2026-quest";
const urls = new Map();

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("photos")) {
        request.result.createObjectStore("photos");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveQuestPhoto(file) {
  const prepared = await prepareImage(file);
  const id = `quest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.objectStore("photos").put(
      { thumb: prepared.thumb, full: prepared.full },
      id
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return { id, lat: prepared.lat, lng: prepared.lng };
}

export async function questPhotoUrl(id, kind = "thumb") {
  if (!id) return "";
  const key = `${id}:${kind}`;
  if (urls.has(key)) return urls.get(key);
  const db = await openDb();
  const blobs = await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (!blobs) return "";
  const blob = kind === "full" ? blobs.full : blobs.thumb;
  const url = URL.createObjectURL(blob);
  urls.set(key, url);
  return url;
}
