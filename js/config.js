/* ==========================================================================
   Japan 2026 - configuration
   --------------------------------------------------------------------------
   Fill in the two Supabase values once the project exists. See SETUP.md.

   Until then the site still runs from data/itinerary.json, but the journal
   stays behind the two family logins. See SETUP.md for the emails.

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

/* SHA-256 of the two local passwords, used only until Supabase is wired up.
   Change them by hashing a new password:
     python3 -c "import hashlib; print(hashlib.sha256(b'YOUR-PASSWORD').hexdigest())"
   Then send the new password round the family. Do not put the password itself
   in this file. */
export const FAMILY_PASSWORD_SHA256 =
  "2eed43c318dbc66eb679efca47058c36ce5cb45933fb790965bddd2dd9056e52";
export const ADMIN_PASSWORD_SHA256 =
  "f6c68dd93c4263b2984394b19a1e722b15d4e2e8a581d2147a88bfc0e6d5a49b";

export const TRIP = {
  title: "Japan Family Trip 2026",
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
