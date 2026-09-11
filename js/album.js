/* ==========================================================================
   Shared family album
   --------------------------------------------------------------------------
   Photos, videos and meals live in Supabase, not on the phone that posted
   them. This file talks to PostgREST and Storage with fetch and the public
   anon key, so a missing supabase-js vendor file cannot empty the gallery
   after refresh or in another browser.

   Image URLs are public and stable. Grids do not wait on signed URLs.
   ========================================================================== */

import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from "./config.js";

export class AlbumError extends Error {
  constructor(message) {
    super(message);
    this.name = "AlbumError";
  }
}

export function requireAlbum() {
  if (!isConfigured()) {
    throw new AlbumError("The online album is not connected yet.");
  }
}

function restHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: "application/json",
    ...extra,
  };
}

function isNetworkError(error) {
  const message = String(error?.message || "");
  return (
    error?.name === "TypeError" ||
    error?.name === "AbortError" ||
    /failed to fetch|networkerror|load failed/i.test(message)
  );
}

/** Hotel wifi and the first tab after sign-in sometimes drop one request.
    Reads try again; writes do not, so a photo cannot land twice. */
async function albumFetch(url, options, fallback) {
  requireAlbum();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store", ...options });
      if (!response.ok) throw await parseError(response, fallback);
      if (response.status === 204) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      if (error instanceof AlbumError) throw error;
      if (attempt === 3 || !isNetworkError(error)) {
        throw new AlbumError(
          "Could not reach the shared album. Check the connection and try again."
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
}

function encodeObjectPath(path) {
  return String(path)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

/** Direct URL for a stored JPEG. Works in every browser without signing. */
export function publicUrl(bucket, path) {
  if (!path) return "";
  if (
    path.startsWith("blob:") ||
    path.startsWith("assets/") ||
    /^https?:\/\//.test(path)
  ) {
    return path;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeObjectPath(path)}`;
}

async function parseError(response, fallback) {
  const text = await response.text();
  try {
    const body = JSON.parse(text);
    const detail =
      body.message || body.error || body.hint || body.error_description;
    if (detail) return new AlbumError(detail);
  } catch {
    /* not JSON */
  }
  return new AlbumError(fallback || `Album request failed (${response.status}).`);
}

export async function albumGet(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const rows = await albumFetch(url, { headers: restHeaders() }, `Could not load ${table}.`);
  return rows || [];
}

export async function albumInsert(table, row) {
  requireAlbum();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: restHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(row),
  });
  if (!response.ok) throw await parseError(response, `Could not save to ${table}.`);
  const rows = await response.json();
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  if (!list.length) {
    throw new AlbumError("Saved, but the album did not return the new row.");
  }
  return Array.isArray(row) ? list : list[0];
}

export async function albumUpload(bucket, path, blob, contentType) {
  requireAlbum();
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeObjectPath(path)}`,
    {
      method: "POST",
      headers: restHeaders({
        "Content-Type": contentType,
        "cache-control": "31536000",
        "x-upsert": "false",
      }),
      body: blob,
    }
  );
  if (!response.ok) throw await parseError(response, `Could not upload to ${bucket}.`);
  return path;
}
