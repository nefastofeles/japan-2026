/* Drop an old service worker before the app boots.
   Yesterday's worker cache-firsts js/supabase.js, so a new browser
   tab still talks to esm.sh and the album looks empty. Unregister,
   delete those caches, then reload once. */
const CURRENT_CACHE = "japan-2026-v43";
const RELOAD_FLAG = "japan-2026-cleared-v43";

function bootApp() {
  if (document.querySelector("script[data-app-boot]")) return;
  const script = document.createElement("script");
  script.type = "module";
  script.src = "js/app.js?v=43";
  script.dataset.appBoot = "1";
  document.body.appendChild(script);
}

async function dropStaleShell() {
  if (!window.isSecureContext) return false;
  if (!("serviceWorker" in navigator) || !("caches" in window)) return false;

  const keys = await caches.keys();
  const stale = keys.some((name) => name !== CURRENT_CACHE);
  if (!stale) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((reg) => reg.unregister()));
  await Promise.all(keys.map((name) => caches.delete(name)));
  return true;
}

dropStaleShell()
  .then((cleared) => {
    if (cleared && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      const url = new URL(location.href);
      url.searchParams.set("v", "43");
      // A new query so replace() always navigates, even when we already
      // landed here from refresh.html?v=43.
      url.searchParams.set("bust", "1");
      location.replace(url.href);
      return;
    }
    bootApp();
  })
  .catch(() => bootApp());
