/* ==========================================================================
   Service worker
   --------------------------------------------------------------------------
   Caches the shell so the site opens with no signal: on a shinkansen, in the
   Kiso valley, on a plane. Photos are not cached, since they are signed URLs
   that expire and would fill the phone up anyway.

   Bump CACHE when you change the shell, otherwise phones keep the old copy.
   ========================================================================== */

const CACHE = "japan-2026-v31";

const SHELL = [
  "./",
  "index.html",
  "robots.txt",
  "manifest.webmanifest",
  "css/tokens.css",
  "css/base.css",
  "css/components.css",
  "css/days.css",
  "css/media.css",
  "css/home.css",
  "css/heroes.css",
  "css/quest.css",
  "css/quest-shell.css",
  "css/quest-screens.css",
  "css/quest-collect.css",
  "js/app.js",
  "js/config.js",
  "js/util.js",
  "js/router.js",
  "js/store.js",
  "js/posts.js",
  "js/auth.js",
  "js/local-posts.js",
  "js/supabase.js",
  "js/media.js",
  "js/places.js",
  "js/weather.js",
  "js/pages/home.js",
  "js/pages/day.js",
  "js/pages/food.js",
  "js/pages/photos.js",
  "js/pages/map.js",
  "js/pages/admin.js",
  "js/pages/admin-forms.js",
  "js/pages/adventure.js",
  "js/pages/adventure-mission.js",
  "js/pages/adventure-more.js",
  "js/pages/adventure-discovery.js",
  "js/pages/adventure-script.js",
  "js/quest/content.js",
  "js/quest/state.js",
  "js/quest/engine.js",
  "js/quest/progress.js",
  "js/quest/modules.js",
  "js/quest/choices.js",
  "js/quest/visual.js",
  "js/quest/media.js",
  "js/quest/location.js",
  "js/quest/photos.js",
  "js/quest/ai.js",
  "js/quest/speech.js",
  "js/quest/sync.js",
  "js/quest/reset.js",
  "js/quest/rank.js",
  "js/quest/mission-screen.js",
  "js/components/quest-chrome.js",
  "js/components/quest-icons.js",
  "js/components/day-strip.js",
  "js/components/photo-grid.js",
  "js/components/lightbox.js",
  "js/components/meal-card.js",
  "js/components/rating-pips.js",
  "js/components/video-embed.js",
  "js/components/booking-card.js",
  "js/components/markdown.js",
  "js/components/reference.js",
  "js/components/route-map.js",
  "js/components/hero-banner.js",
  "js/components/best-of.js",
  "js/components/japan-outline.js",
  "assets/logo.svg",
  "assets/heroes/fuji.jpg",
  "js/mock-memories.js",
  "assets/fonts/AtkinsonHyperlegible-Regular.woff2",
  "assets/fonts/AtkinsonHyperlegible-Bold.woff2",
  "assets/heroes/crane.jpg",
  "assets/heroes/haneda.jpg",
  "assets/heroes/senso-ji.jpg",
  "assets/heroes/fushimi-inari.jpg",
  "assets/heroes/osaka-castle.jpg",
  "assets/heroes/peace-memorial.jpg",
  "assets/heroes/itsukushima.jpg",
  "assets/heroes/kenrokuen.jpg",
  "assets/heroes/sanmachi.jpg",
  "assets/heroes/magome.jpg",
  "assets/heroes/tokyo-tower.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase or YouTube

  // The itinerary changes often, so prefer the network and fall back to cache.
  const isData = url.pathname.endsWith(".json");

  event.respondWith(
    isData
      ? fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => caches.match(request))
      : caches.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
              return response;
            })
        )
  );
});
