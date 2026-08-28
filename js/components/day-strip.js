/* ==========================================================================
   Day strip - 24 days grouped into legs, scrolling sideways.
   Also renders the plain list used on the home page, for anyone who does not
   get on with horizontal scrolling.
   ========================================================================== */

import { legGroups, getLeg } from "../store.js";
import { esc, shortDate, todayISO } from "../util.js";
import { TRIP } from "../config.js";

function chip(day, { activeKey, today }) {
  const key = day.date || day.slug;
  const isActive = key === activeKey;
  const isToday = day.date && day.date === today;

  const classes = ["day-chip"];
  if (day.kind !== "day") classes.push("day-chip--book");
  if (isToday) classes.push("day-chip--today");

  const label =
    day.kind === "day"
      ? (() => {
          const { day: d, month } = shortDate(day.date);
          return `<span class="day-chip__num">${d}</span>
                  <span class="day-chip__mon">${month}</span>`;
        })()
      : `<span class="day-chip__num">${esc(day.kind === "pre" ? "Before" : "After")}</span>`;

  return `<a class="${classes.join(" ")}" href="#${
    day.kind === "day" ? `/day/${day.date}` : `/${day.slug}`
  }" ${isActive ? 'aria-current="page"' : ""} title="${esc(day.title)}">${label}</a>`;
}

export function dayStrip(activeKey) {
  const today = todayISO(TRIP.timezone);

  const groups = legGroups()
    .map((group) => {
      const meta = group.meta;
      const days = group.days
        .map((d) => chip(d, { activeKey, today }))
        .join("");

      return `
        <div class="leg-group" data-leg="${esc(group.leg)}">
          <div class="leg-group__label">
            <span class="leg-group__name">${esc(meta.name)}</span>
            <span class="leg-group__jp jp" title="${esc(meta.romaji || "")} - ${esc(
              meta.meaning || ""
            )}">${esc(meta.jp || "")}</span>
          </div>
          <div class="leg-group__days">${days}</div>
        </div>`;
    })
    .join("");

  return `<nav class="day-strip" aria-label="Trip days">
            <div class="day-strip__scroll">${groups}</div>
          </nav>`;
}

/** Scroll the active chip into view without moving the whole page. */
export function centreActiveChip() {
  const strip = document.querySelector(".day-strip__scroll");
  const active =
    strip?.querySelector('[aria-current="page"]') ||
    strip?.querySelector(".day-chip--today");
  if (!strip || !active) return;

  const target =
    active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
  strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
}

export function dayList(days) {
  return `<div class="day-list">${days.map(dayListItem).join("")}</div>`;
}

/** Same list, split into coloured city groups — used on the home page. */
export function dayListByLeg() {
  return `<div class="day-list">${legGroups()
    .map((group) => {
      const meta = group.meta;
      return `<section class="day-list__group" data-leg="${esc(group.leg)}">
                <h3 class="day-list__leg">
                  <span>${esc(meta.name)}</span>
                  <span class="day-list__leg-jp jp">${esc(meta.jp || "")}</span>
                </h3>
                ${group.days.map(dayListItem).join("")}
              </section>`;
    })
    .join("")}</div>`;
}

function dayListItem(d) {
  const href = d.kind === "day" ? `#/day/${d.date}` : `#/${d.slug}`;
  const when =
    d.kind === "day"
      ? (() => {
          const { day, month } = shortDate(d.date);
          return `${day} ${month}`;
        })()
      : getLeg(d.leg).name;

  return `<a class="day-list__item" data-leg="${esc(d.leg)}" href="${href}">
            <span class="day-list__date">${esc(when)}</span>
            <span class="day-list__title">${esc(d.title)}</span>
            <span class="day-list__city">${esc(d.city || "")}</span>
          </a>`;
}
