/* ==========================================================================
   Japan 2026 - authentication
   --------------------------------------------------------------------------
   There are exactly two accounts:

     admin   - Javier. Can upload, write and delete.
     viewer  - one shared family login. Can read everything, comment and react.

   Family members are not accounts, they are rows in the `people` table. That
   way Leo can rate a bowl of ramen without owning an email address.

   Until Supabase is wired up, the same two logins are checked locally against
   SHA-256 hashes in config.js. That is a gate, not a vault: it stops a
   forwarded URL, it does not hide the files in a public git repo.
   ========================================================================== */

import { getClient } from "./supabase.js";
import {
  isConfigured,
  FAMILY_PASSWORD_SHA256,
  ADMIN_PASSWORD_SHA256,
} from "./config.js";

const LOCAL_SESSION_KEY = "japan-2026-local-session";

const LOCAL_ACCOUNTS = [
  {
    emails: ["family", "family@japan-2026.local"],
    role: "viewer",
    passwordSha256: FAMILY_PASSWORD_SHA256,
  },
  {
    emails: ["admin", "admin@japan-2026.local"],
    role: "admin",
    passwordSha256: ADMIN_PASSWORD_SHA256,
  },
];

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

function readLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalSession(session) {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/@japan-2026\.local$/, "");
}

export async function init() {
  if (isConfigured()) {
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

  cachedSession = readLocalSession();
  cachedIsAdmin = cachedSession ? cachedSession.role === "admin" : false;
  return cachedSession;
}

export function getSession() {
  return cachedSession;
}

/** Nothing in the journal is visible until one of the two logins is used. */
export function isSignedIn() {
  return Boolean(cachedSession);
}

/** Asks the database when it exists, so it cannot be faked by editing the page. */
export async function isAdmin() {
  if (!cachedSession) return false;
  if (cachedIsAdmin !== null) return cachedIsAdmin;

  if (!isConfigured()) {
    cachedIsAdmin = cachedSession.role === "admin";
    return cachedIsAdmin;
  }

  const supabase = await getClient();
  const { data, error } = await supabase.rpc("is_admin");
  cachedIsAdmin = error ? false : Boolean(data);
  if (error) console.warn("is_admin check failed:", error.message);
  return cachedIsAdmin;
}

async function signInLocal(email, password) {
  const name = normalizeEmail(email);
  const digest = await sha256Hex(password);
  const account = LOCAL_ACCOUNTS.find(
    (row) => row.emails.includes(name) && row.passwordSha256 === digest
  );
  if (!account) throw new Error("That login is not right.");

  cachedSession = {
    user: { email: account.emails[1] || account.emails[0] },
    role: account.role,
  };
  cachedIsAdmin = account.role === "admin";
  writeLocalSession(cachedSession);
  announce();
  return cachedSession;
}

export async function signIn(email, password) {
  if (isConfigured()) {
    const supabase = await getClient();
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

  return signInLocal(email, password);
}

export async function signOut() {
  if (isConfigured()) {
    const supabase = await getClient();
    if (supabase) await supabase.auth.signOut();
  }
  localStorage.removeItem(LOCAL_SESSION_KEY);
  cachedSession = null;
  cachedIsAdmin = null;
  announce();
}
