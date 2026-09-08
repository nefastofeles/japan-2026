/* ==========================================================================
   Japan 2026 - authentication
   --------------------------------------------------------------------------
   Unused until the family login comes back. The hashes live in config.js.
   ========================================================================== */

import { GATE_USER_SHA256, GATE_PASSWORD_SHA256 } from "./config.js";

const LOCAL_SESSION_KEY = "japan-2026-gate";

let cachedSession = null;
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
    if (!parsed?.ok) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function init() {
  cachedSession = readLocalSession();
  return cachedSession;
}

export function getSession() {
  return cachedSession;
}

/** Nothing in the journal is visible until the gate login is used. */
export function isSignedIn() {
  return Boolean(cachedSession);
}

/** The gate login is the posting login. */
export async function isAdmin() {
  return Boolean(cachedSession);
}

export async function signIn(user, password) {
  const userDigest = await sha256Hex(String(user || "").trim());
  const passDigest = await sha256Hex(String(password || ""));
  if (userDigest !== GATE_USER_SHA256 || passDigest !== GATE_PASSWORD_SHA256) {
    throw new Error("That login is not right.");
  }

  cachedSession = { ok: true };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(cachedSession));
  announce();
  return cachedSession;
}

export async function signOut() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
  cachedSession = null;
  announce();
}
