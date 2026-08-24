/* ==========================================================================
   Japan 2026 - small helpers
   ========================================================================== */

import { TRIP } from "./config.js";

/** Escape text before putting it inside HTML. Always use this on anything
    that came from a person, or a stray < will break the page. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ------------------------------------------------------------------ dates */

/* Trip dates are plain "YYYY-MM-DD" strings, never timestamps. Japan is nine
   hours ahead of home, so anything built on UTC would put photos on the wrong
   day. Parsing the parts by hand keeps a date meaning the same calendar day
   everywhere in the world. */

export function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday",
                  "Thursday", "Friday", "Saturday"];

export function formatDate(iso, { weekday = true } = {}) {
  const d = parseDate(iso);
  if (!d) return "";
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return weekday ? `${WEEKDAYS[d.getDay()]} ${base}` : base;
}

export function shortDate(iso) {
  const d = parseDate(iso);
  return d ? { day: d.getDate(), month: MONTHS[d.getMonth()] } : { day: "", month: "" };
}

/** Today as "YYYY-MM-DD" in the traveller's local time. */
export function todayISO(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Current wall-clock time in a timezone, e.g. "23:40". */
export function timeIn(timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
}

/** "before" | "during" | "after" - drives the three states of the home page. */
export function tripPhase(now = todayISO()) {
  if (now < TRIP.start) return "before";
  if (now > TRIP.end) return "after";
  return "during";
}

/** Whole days from now until the trip starts. */
export function daysUntilStart() {
  const start = parseDate(TRIP.start);
  const now = parseDate(todayISO());
  return Math.max(0, Math.round((start - now) / 86400000));
}

export function relativeTime(isoTimestamp) {
  const then = new Date(isoTimestamp);
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString();
}

/* ------------------------------------------------------------------ misc */

export function yen(amount) {
  if (amount === null || amount === undefined || amount === "") return "";
  return "¥" + Number(amount).toLocaleString("en-US");
}

/** Pull the 11-character video id out of any shape of YouTube link. */
export function youtubeId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function groupBy(items, keyOf) {
  const out = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(item);
  }
  return out;
}

export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
