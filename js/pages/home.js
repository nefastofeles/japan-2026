/* ==========================================================================
   Home
   --------------------------------------------------------------------------
   Three states, because the same page has three different jobs over its life:

     before   a countdown and the plan
     during   a dashboard: the local time where we are, today's bookings,
              the newest photos. This is what makes the family open the site
              in the morning as well as the evening.
     after    the wrap-up
   ========================================================================== */

import {
  getTrip, getTravelDays, getDay, getLeg, allMedia, allFood,
} from "../store.js";
import { TRIP } from "../config.js";
import {
  esc, formatDate, timeIn, todayISO, tripPhase, daysUntilStart, yen,
} from "../util.js";
import { dayListByLeg } from "../components/day-strip.js";
import { photoGrid, bindPhotoGrid } from "../components/photo-grid.js";
import { bookingCard } from "../components/booking-card.js";
import { mountRouteMap } from "../components/route-map.js";
import { weatherBoard, bindLiveWeather } from "../weather.js";

function countdown() {
  const days = daysUntilStart();
  return `
    <div class="countdown">
      <div class="countdown__unit">
        <span class="countdown__n">${days}</span>
        <span class="countdown__l">day${days === 1 ? "" : "s"} to go</span>
      </div>
      <div class="countdown__unit">
        <span class="countdown__n">${getTravelDays().length}</span>
        <span class="countdown__l">days in Japan</span>
      </div>
    </div>`;
}

function nowCard(today) {
  const day = getDay(today);
  const where = day ? day.city : "Japan";
  const leg = day ? day.leg : "inbound";

  return `
    <div class="now-card" data-leg="${esc(leg)}">
      <span class="now-card__time" data-clock>${esc(timeIn(TRIP.timezone))}</span>
      <span>in <strong>${esc(where)}</strong></span>
    </div>`;
}

export async function homePage() {
  const trip = getTrip();
  const today = todayISO(TRIP.timezone);
  const phase = tripPhase(today);
  const todayDay = getDay(today);

  let lead = "";
  let mountExtras = () => {};
  let recent = [];

  if (phase === "before") {
    lead = `
      ${countdown()}
      <p style="text-align:center"><a class="btn" href="#/before">See the itinerary</a></p>`;
  } else if (phase === "during") {
    const todaysBookings = todayDay && todayDay.bookings ? todayDay.bookings : [];
    try {
      recent = await allMedia({ limit: 12 });
    } catch (error) {
      console.warn("Shared album failed to load", error);
      recent = [];
    }

    lead = `
      ${nowCard(today)}
      ${
        todayDay
          ? `<p style="text-align:center">
               <a class="btn" href="#/day/${esc(todayDay.date)}">Today: ${esc(todayDay.title)}</a>
             </p>`
          : ""
      }
      ${
        todaysBookings.length
          ? `<section><h2 class="section-title">Today</h2>
             <div class="stack">${todaysBookings.map(bookingCard).join("")}</div></section>`
          : ""
      }
      ${
        recent.length
          ? `<section><h2 class="section-title">Just added</h2>
             ${await photoGrid(recent)}</section>`
          : ""
      }`;
  } else {
    let media = [];
    let meals = [];
    try {
      [media, meals] = await Promise.all([allMedia({ limit: 12 }), allFood()]);
    } catch (error) {
      console.warn("Shared album failed to load", error);
    }
    recent = media;
    const spent = meals.reduce((sum, m) => sum + (m.price_yen || 0), 0);

    lead = `
      <section class="stat-grid">
        <div class="stat"><span class="stat__n">${getTravelDays().length}</span>
          <span class="stat__l">days</span></div>
        <div class="stat"><span class="stat__n">${media.length}</span>
          <span class="stat__l">photos</span></div>
        <div class="stat"><span class="stat__n">${meals.length}</span>
          <span class="stat__l">meals</span></div>
        <div class="stat"><span class="stat__n">${esc(yen(spent) || "—")}</span>
          <span class="stat__l">on food</span></div>
      </section>
      <p style="text-align:center"><a class="btn" href="#/after">Read the wrap-up</a></p>`;
  }

  const html = `
    <div class="page stack page--home">
      <figure class="fuji-card">
        <img src="assets/heroes/fuji.jpg" alt="Mount Fuji, after Hokusai’s Red Fuji">
        <figcaption class="fuji-card__caption">
          <span class="jp">富士山</span> · A postcard of Mount Fuji
        </figcaption>
      </figure>
      <header class="hero">
        <h1 class="hero__title">${esc(trip.name)}</h1>
        <p class="hero__sub">${esc(trip.subtitle)} ·
           ${esc(formatDate(trip.startDate, { weekday: false }))} to
           ${esc(formatDate(trip.endDate, { weekday: false }))}</p>
      </header>

      ${lead}

      ${weatherBoard()}

      <section>
        <h2 class="section-title">The route</h2>
        <p class="measure muted">Tokyo down to Hiroshima, north to Kanazawa, into the Alps and back.</p>
        <div id="home-map" class="japan-map-host japan-map-host--home"></div>
      </section>

      <section>
        <h2 class="section-title">The Plan</h2>
        ${dayListByLeg()}
      </section>
    </div>`;

  return {
    html,
    mount(root) {
      if (recent.length) bindPhotoGrid(root, recent);

      const homeMap = root.querySelector("#home-map");
      if (homeMap) mountRouteMap(homeMap);
      bindLiveWeather(root);

      const clock = root.querySelector("[data-clock]");
      if (clock) {
        const tick = () => (clock.textContent = timeIn(TRIP.timezone));
        const timer = setInterval(tick, 20000);
        // Stop the clock when this page is replaced.
        new MutationObserver((_records, observer) => {
          if (!document.contains(clock)) {
            clearInterval(timer);
            observer.disconnect();
          }
        }).observe(document.body, { childList: true, subtree: true });
      }
    },
  };
}

export { getLeg };
