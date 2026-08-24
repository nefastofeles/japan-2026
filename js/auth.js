/* ==========================================================================
   Japan 2026 - authentication
   --------------------------------------------------------------------------
   There are exactly two accounts:

     admin   - Javier. Can upload, write and delete.
     viewer  - one shared family login. Can read everything, comment and react.

   Family members are not accounts, they are rows in the `people` table. That
   way Leo can rate a bowl of ramen without owning an email address.
   ========================================================================== */

import { getClient } from "./supabase.js";
import { isConfigured } from "./config.js";

let cachedSession = null;
let cachedIsAdmin = null;
const listeners = new Set();

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function announce() {
  for (const fn of listeners) fn(cachedSession);
}

export async function init() {
  if (!isConfigured()) return null;
  const supabase = await getClient();

  const { data } = await supabase.auth.getSession();
  cachedSession = data.session;

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedSession = session;
    cachedIsAdmin = null;
    announce();
  });

  return cachedSession;
}

export function getSession() {
  return cachedSession;
}

/** In plan mode there is no backend, so treat everyone as signed in. */
export function isSignedIn() {
  return !isConfigured() || Boolean(cachedSession);
}

/** Asks the database, so it cannot be faked by editing the page. */
export async function isAdmin() {
  if (!isConfigured()) return false;
  if (cachedIsAdmin !== null) return cachedIsAdmin;
  if (!cachedSession) return false;

  const supabase = await getClient();
  const { data, error } = await supabase.rpc("is_admin");
  cachedIsAdmin = error ? false : Boolean(data);
  if (error) console.warn("is_admin check failed:", error.message);
  return cachedIsAdmin;
}

export async function signIn(email, password) {
  const supabase = await getClient();
  if (!supabase) throw new Error("Supabase is not configured yet.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;

  cachedSession = data.session;
  cachedIsAdmin = null;
  announce();
  return data.session;
}

export async function signOut() {
  const supabase = await getClient();
  if (supabase) await supabase.auth.signOut();
  cachedSession = null;
  cachedIsAdmin = null;
  announce();
}
