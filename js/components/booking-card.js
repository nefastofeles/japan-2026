/* ==========================================================================
   Bookings - the fixed, already-paid-for, timed-entry things.
   --------------------------------------------------------------------------
   These come from data/itinerary.json rather than the database, because they
   are plans rather than memories. They exist before the day happens, which is
   what lets the home page say "Today: teamLab Kyoto, 14:00" and turn the site
   into something the family opens in the morning as well as the evening.

   Keep real confirmation numbers out of here. This file is in git.
   ========================================================================== */

import { esc } from "../util.js";

export function bookingCard(booking) {
  return `
    <div class="booking">
      <span class="booking__time">${esc(booking.time || "—")}</span>
      <span>
        <span class="booking__title">${esc(booking.title)}</span>
        ${booking.note ? `<br><span class="booking__note">${esc(booking.note)}</span>` : ""}
      </span>
    </div>`;
}

export function bookings(list = []) {
  if (!list.length) return "";
  return `<section>
            <h2 class="section-title">Booked</h2>
            <div class="stack">${list.map(bookingCard).join("")}</div>
          </section>`;
}
