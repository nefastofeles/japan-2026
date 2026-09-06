/* ==========================================================================
   Japan 2026 - configuration
   --------------------------------------------------------------------------
   Fill in the two Supabase values once the project exists. See SETUP.md.

   Until then the site runs in "plan mode": every day page renders from
   data/itinerary.json, with no login and no photos. That is deliberate, so
   the site is useful and shareable before any backend is set up.

   The anon key is safe to commit. It is designed to be public and every table
   is protected by row level security. NEVER put the service_role key here.
   ========================================================================== */

export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";

/** True once Supabase has been configured. */
export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/* Dress-rehearsal memories for two days, so we can see a full page
   before anyone has posted. They vanish on their own once Supabase is
   filled in. Set this to false if you want plan mode back sooner. */
export const USE_MOCK_MEMORIES = true;

export const TRIP = {
  title: "Japan 2026",
  start: "2026-09-15",
  end: "2026-10-06",
  timezone: "Asia/Tokyo",
  homeTimezone: "Europe/Copenhagen",
};

/* Photos are resized in the browser before upload. These numbers are what
   keep the whole trip inside a sensible storage and bandwidth budget:
   a 4MB phone photo becomes roughly 400KB, and the grid thumbnail ~40KB. */
export const IMAGE = {
  fullMaxEdge: 2000,
  fullQuality: 0.82,
  thumbMaxEdge: 400,
  thumbQuality: 0.72,
};

export const REACTION_EMOJI = ["❤️", "😍", "😂", "🤩", "🍜", "⛩️"];
