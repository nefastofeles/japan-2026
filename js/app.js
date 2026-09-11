/* ==========================================================================
   Japan 2026 - start here
   --------------------------------------------------------------------------
   This file wires everything together: load the data, register the routes,
   start the router. If you want to understand the site, read this first and
   then follow whichever page you are curious about.
   ========================================================================== */

import * as store from "./store.js";
import * as router from "./router.js";
import * as auth from "./auth.js";
import { esc, todayISO, tripPhase } from "./util.js";
import { TRIP } from "./config.js";

import { homePage } from "./pages/home.js";
import { dayPage } from "./pages/day.js";
import { foodPage } from "./pages/food.js";
import { photosPage } from "./pages/photos.js";
import { mapPage } from "./pages/map.js";
import { adminPage } from "./pages/admin.js";
import { loginPage } from "./pages/login.js";
import { adventurePage } from "./pages/adventure.js";
import { adventureMissionPage } from "./pages/adventure-mission.js";
import { adventureDiscoveryPage } from "./pages/adventure-discovery.js";
import { adventureScriptPage } from "./pages/adventure-script.js";
import {
  adventureMapPage, adventureChapterPage, adventureModulePage,
} from "./pages/adventure-journey.js";
import {
  adventureCodexPage, adventureBadgesPage, adventureStoryPage,
} from "./pages/adventure-more.js";
import { bindSpeechLifecycle } from "./quest/speech.js";

const NAV = [
  ["/", "Home"],
  ["/before", "Itinerary"],
  ["/adventure", "Quest"],
  ["/food", "Food"],
  ["/photos", "Photos"],
  ["/map", "Map"],
  ["/after", "After"],
];

function renderNav(path) {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  if (!auth.isSignedIn()) {
    nav.innerHTML = "";
    return;
  }

  nav.innerHTML =
    NAV.map(([href, label]) => {
      const on =
        href === "/"
          ? path === "/"
          : path === href || path.startsWith(`${href}/`);
      return `<a href="#${href}" ${on ? 'aria-current="page"' : ""}>${esc(label)}</a>`;
    }).join("") +
    `<button type="button" class="site-signout" data-signout>Sign out</button>`;
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

  const signedIn = auth.isSignedIn();
  const onHome = path === "/" && signedIn;
  document.documentElement.toggleAttribute("data-home", onHome);
  document.documentElement.toggleAttribute("data-locked", !signedIn);

  const adminLink = document.querySelector("[data-footer-admin]");
  if (adminLink) {
    adminLink.hidden = !signedIn;
    adminLink.setAttribute("aria-current", path === "/admin" ? "page" : "false");
  }

  const signOutButton = document.querySelector("[data-signout]");
  if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
      await auth.signOut();
      location.hash = "#/";
      location.reload();
    });
  }

  if (!signedIn) {
    document.documentElement.removeAttribute("data-quest");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = "#BC002D";
    syncHeaderHeight();
    return;
  }

  const onQuest = path.startsWith("/adventure");
  document.documentElement.toggleAttribute("data-quest", onQuest);

  const legId = chromeLeg(path);
  document.documentElement.dataset.leg = legId;

  const meta = document.querySelector('meta[name="theme-color"]');
  const colour = onHome || onQuest ? "#BC002D" : washHex(store.getLeg(legId).colour);
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
  router.route("/adventure", adventurePage);
  router.route("/adventure/map", adventureMapPage);
  router.route("/adventure/map/:chapterId/:moduleId", adventureModulePage);
  router.route("/adventure/map/:chapterId", adventureChapterPage);
  router.route("/adventure/codex", adventureCodexPage);
  router.route("/adventure/badges", adventureBadgesPage);
  router.route("/adventure/story", adventureStoryPage);
  router.route("/adventure/mission/:id", adventureMissionPage);
  router.route("/adventure/discovery/:id", adventureDiscoveryPage);
  router.route("/adventure/script", adventureScriptPage);

  router.setNotFound(
    (path) => `<div class="page">
                 <p class="empty">Nothing lives at <code>${esc(path)}</code>.</p>
                 <p style="text-align:center"><a class="btn" href="#/">Back to the start</a></p>
               </div>`
  );
}

async function boot() {
  await auth.init();

  const title = document.querySelector(".site-title-text");

  if (!auth.isSignedIn()) {
    document.title = "Sign in · Japan Family Trip 2026";
    if (title) title.textContent = "Japan Family Trip 2026";
    router.setNotFound(() => loginPage());
    router.start(document.getElementById("app"), { afterRender });
    return;
  }

  await store.load();

  const trip = store.getTrip();
  document.title = trip.name;
  if (title) title.textContent = trip.name;

  window.addEventListener("resize", syncHeaderHeight);

  registerPages();
  bindSpeechLifecycle();
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
   It is what lets the site open on a shinkansen with no signal.
   Skip it on localhost: python’s one-request-at-a-time server deadlocks
   while the worker tries to cache the whole shell. */
const onLoopback = ["localhost", "127.0.0.1"].includes(location.hostname);
function registerShellWorker() {
  // Query string plus updateViaCache none: an old worker that cache-firsts
  // /sw.js will miss this URL and actually download the new file.
  navigator.serviceWorker
    .register("sw.js?v=42", { updateViaCache: "none" })
    .catch(() => {
      /* offline support is a bonus, never a requirement */
    });
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !onLoopback) {
  // cache-bust.js often starts this module after window "load" already fired.
  if (document.readyState === "complete") registerShellWorker();
  else window.addEventListener("load", registerShellWorker);
}
