/* ==========================================================================
   Japan 2026 - Supabase client
   The library is only downloaded if the project has actually been configured,
   so "plan mode" stays completely dependency-free.
   ========================================================================== */

import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from "./config.js";

const CDN = "https://esm.sh/@supabase/supabase-js@2";

let clientPromise = null;

export async function getClient() {
  if (!isConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import(CDN).then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    );
  }
  return clientPromise;
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
