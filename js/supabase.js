/* ==========================================================================
   Japan 2026 - Supabase client
   The UMD build lives in js/vendor/supabase.js and is loaded from
   index.html. Phones must not depend on esm.sh; it often fails on
   mobile networks and then the album looks empty.
   ========================================================================== */

import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from "./config.js";

let clientPromise = null;

function supabaseLibrary() {
  const lib = globalThis.supabase;
  if (!lib?.createClient) {
    throw new Error("Supabase library did not load.");
  }
  return lib;
}

export async function getClient() {
  if (!isConfigured()) return null;
  if (!clientPromise) {
    try {
      const client = supabaseLibrary().createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
      clientPromise = Promise.resolve(client);
    } catch (error) {
      console.warn("Supabase client skipped:", error.message);
      return null;
    }
  }
  return clientPromise;
}

/**
 * Browser client only after the planned family (or admin) login.
 * The anon key must never be enough to read or wipe Quest rows.
 */
export async function getAuthedClient() {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ? supabase : null;
}

/**
 * Sign a batch of storage paths in one request.
 *
 * A photo grid with 300 thumbnails must never sign them one at a time; that
 * would be 300 round trips. createSignedUrls takes the whole list at once.
 */
export async function signPaths(bucket, paths, expiresIn = 3600) {
  const map = new Map();
  const wanted = [...new Set(paths.filter(Boolean))];
  if (!wanted.length) return map;

  const supabase = await getClient();
  if (!supabase) return map;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(wanted, expiresIn);

  if (error) {
    console.warn(`Could not sign ${bucket} URLs:`, error.message);
    return map;
  }
  for (const row of data || []) {
    if (row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return map;
}
