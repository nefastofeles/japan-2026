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
import { esc } from "./util.js";
import { isConfigured } from "./config.js";

import { homePage } from "./pages/home.js";
import { dayPage } from "./pages/day.js";
import { foodPage } from "./pages/food.js";
import { photosPage } from "./pages/photos.js";
import { mapPage } from "./pages/map.js";
import { adminPage } from "./pages/admin.js";

const NAV = [
  ["/", "Home"],
  ["/before", "Before"],
  ["/food", "Food"],
  ["/photos", "Photos"],
  ["/map", "Map"],
  ["/after", "After"],
];

function renderNav(path) {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  nav.innerHTML =
    NAV.map(
      ([href, label]) =>
        `<a href="#${href}" ${
          path === href ? 'aria-current="page"' : ""
        }>${esc(label)}</a>`
    ).join("") +
    (isConfigured() ? `<a href="#/admin">Post</a>` : "");
}

async function boot() {
  await store.load();
  await auth.init();

  const trip = store.getTrip();
  document.title = trip.name;
  const title = document.querySelector(".site-title a");
  if (title) title.textContent = trip.name;

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

  router.start(document.getElementById("app"), { afterRender: renderNav });
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
