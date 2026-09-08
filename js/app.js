/* ==========================================================================
   Japan 2026 - start here
   --------------------------------------------------------------------------
   This file wires everything together: load the data, register the routes,
   start the router. If you want to understand the site, read this first and
   then follow whichever page you are curious about.
   ========================================================================== */

import * as store from "./store.js";
import * as router from "./router.js";
import { esc, todayISO, tripPhase } from "./util.js";
import { TRIP } from "./config.js";

import { homePage } from "./pages/home.js";
import { dayPage } from "./pages/day.js";
import { foodPage } from "./pages/food.js";
import { photosPage } from "./pages/photos.js";
import { mapPage } from "./pages/map.js";
import { adminPage } from "./pages/admin.js";

const NAV = [
  ["/", "Home"],
  ["/before", "Itinerary"],
  ["/food", "Food"],
  ["/photos", "Photos"],
  ["/map", "Map"],
  ["/after", "After"],
];

function renderNav(path) {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  nav.innerHTML = NAV.map(
    ([href, label]) =>
      `<a href="#${href}" ${
        path === href ? 'aria-current="page"' : ""
      }>${esc(label)}</a>`
  ).join("");
}

/** Mix a leg hex onto washi paper so the phone chrome matches the page wash. */
function washHex(hex) {
  const raw = String(hex || "").replace("#", "");
  if (raw.length !== 6) return "#FAF8F3";
  const paper = [0xfa, 0xf8, 0xf3];
  const amount = 0.22;
  const mix = (offset, paperChannel) => {
    const channel = parseInt(raw.slice(offset, offset + 2), 16);
    return Math.round(channel * amount + paperChannel * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${mix(0, paper[0])}${mix(2, paper[1])}${mix(4, paper[2])}`;
}

function syncHeaderHeight() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  document.documentElement.style.setProperty(
    "--header-height",
    `${header.offsetHeight}px`
  );
}

function chromeLeg(path) {
  if (path.startsWith("/day/")) {
    return store.getDay(path.slice("/day/".length))?.leg || "inbound";
  }
  if (path === "/before") return "before";
  if (path === "/after") return "after";

  const today = todayISO(TRIP.timezone);
  const phase = tripPhase(today);
  if (phase === "before") return "inbound";
  if (phase === "after") return "after";
  return store.getDay(today)?.leg || "inbound";
}

function afterRender(path) {
  renderNav(path);

  const onHome = path === "/";
  document.documentElement.toggleAttribute("data-home", onHome);

  const adminLink = document.querySelector("[data-footer-admin]");
  if (adminLink) {
    adminLink.hidden = false;
    adminLink.setAttribute("aria-current", path === "/admin" ? "page" : "false");
  }

  const legId = chromeLeg(path);
  document.documentElement.dataset.leg = legId;

  const meta = document.querySelector('meta[name="theme-color"]');
  const colour = onHome ? "#BC002D" : washHex(store.getLeg(legId).colour);
  if (meta) meta.content = colour;

  syncHeaderHeight();
}

function registerPages() {
  router.route("/", homePage);
  router.route("/before", () => dayPage({ date: "before" }));
  router.route("/after", () => dayPage({ date: "after" }));
  router.route("/day/:date", dayPage);
  router.route("/food", foodPage);
  router.route("/photos", photosPage);
  router.route("/map", mapPage);
  router.route("/admin", adminPage);

  router.setNotFound(
    (path) => `<div class="page">
                 <p class="empty">Nothing lives at <code>${esc(path)}</code>.</p>
                 <p style="text-align:center"><a class="btn" href="#/">Back to the start</a></p>
               </div>`
  );
}

async function boot() {
  await store.load();

  const trip = store.getTrip();
  document.title = trip.name;
  const title = document.querySelector(".site-title-text");
  if (title) title.textContent = trip.name;

  window.addEventListener("resize", syncHeaderHeight);

  registerPages();
  router.start(document.getElementById("app"), { afterRender });
}

boot().catch((error) => {
  console.error(error);
  document.getElementById("app").innerHTML = `
    <div class="page">
      <div class="notice">
        <strong>The site could not start.</strong>
        <p class="small">${esc(error.message)}</p>
        <p class="small">If you are opening index.html directly, use a local server
        instead: <code>python3 -m http.server</code></p>
      </div>
    </div>`;
});

/* The service worker only caches the shell, and only when served over http(s).
   It is what lets the site open on a shinkansen with no signal. */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline support is a bonus, never a requirement */
    });
  });
}
