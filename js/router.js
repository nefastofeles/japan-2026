/* ==========================================================================
   Japan 2026 - router
   --------------------------------------------------------------------------
   Hash routing, so the site works on any static host with no server config
   and no build step. Every URL looks like:

     #/                    home
     #/before              pre-trip page
     #/day/2026-09-18      one day
     #/food                every meal of the trip
     #/photos              every photo
     #/map                 the route
     #/after               post-trip page
     #/adventure           Quest Game
     #/adventure/mission/:id  one mission
   ========================================================================== */

const routes = [];
let notFound = () => "<p>Page not found.</p>";
let outlet = null;
let onRendered = null;

export function route(pattern, handler) {
  // "/day/:date" becomes a regex with a named-ish capture group.
  const names = [];
  const source = pattern
    .replace(/\/:([\w]+)/g, (_, name) => {
      names.push(name);
      return "/([^/]+)";
    });
  routes.push({ regex: new RegExp(`^${source}$`), names, handler });
}

export function setNotFound(handler) {
  notFound = handler;
}

export function currentPath() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash === "" || hash === "/" ? "/" : hash.replace(/\/$/, "");
}

export function navigate(path) {
  window.location.hash = path;
}

function match(path) {
  for (const r of routes) {
    const found = path.match(r.regex);
    if (found) {
      const params = {};
      r.names.forEach((name, i) => (params[name] = decodeURIComponent(found[i + 1])));
      return { handler: r.handler, params };
    }
  }
  return null;
}

async function render() {
  const path = currentPath();
  const found = match(path);

  outlet.setAttribute("aria-busy", "true");
  outlet.innerHTML = '<div class="spinner" role="status" aria-label="Loading"></div>';

  // A page handler may return either an HTML string, or an object of the shape
  // { html, mount } where mount(rootElement) runs once the HTML is on the page.
  // That is where event listeners get attached.
  let result;
  try {
    result = found ? await found.handler(found.params) : await notFound(path);
  } catch (error) {
    console.error(error);
    result = `<div class="notice"><strong>Something went wrong.</strong>
              <p class="small">${error.message}</p></div>`;
  }

  const html = typeof result === "string" ? result : result.html;
  outlet.innerHTML = html;
  outlet.removeAttribute("aria-busy");

  if (result && typeof result.mount === "function") {
    try {
      result.mount(outlet);
    } catch (error) {
      console.error("mount failed:", error);
    }
  }

  // Only jump to the top when the page itself changed, so that the day strip
  // does not yank the view around while someone is browsing within a page.
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  if (onRendered) onRendered(path);
}

export function start(element, { afterRender } = {}) {
  outlet = element;
  onRendered = afterRender;
  window.addEventListener("hashchange", render);
  render();
}
