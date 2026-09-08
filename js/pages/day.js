/* ==========================================================================
   Day page
   --------------------------------------------------------------------------
   One template for all 24 pages. The pre-trip and post-trip pages are just
   days with kind "pre" and "post", so they get the same layout, the same
   editor and the same upload flow with no extra code paths.
   ========================================================================== */

import {
  getDay, neighbours, dayNumber, getLeg,
  mediaForDay, mealsForDay, entriesForDay, bestOfForDay,
} from "../store.js";
import { esc, formatDate, youtubeId } from "../util.js";
import { dayStrip, centreActiveChip } from "../components/day-strip.js";
import { bookings } from "../components/booking-card.js";
import { videoEmbed, bindVideos } from "../components/video-embed.js";
import {
  photoAlbum, bindPhotoGrid, DAY_PHOTO_LIMIT, DAY_VIDEO_LIMIT,
} from "../components/photo-grid.js";
import { mealBoard } from "../components/meal-card.js";
import { markdown } from "../components/markdown.js";
import {
  weatherLine, watchlistSection, packingSection, weatherTable,
} from "../components/reference.js";
import { bindLiveWeather } from "../weather.js";
import { destinationHero } from "../components/hero-banner.js";
import { bestOfSection } from "../components/best-of.js";

function header(day) {
  const counter = dayNumber(day);
  const where = [day.city, day.overnight && day.overnight !== day.city
    ? `sleeping in ${day.overnight}` : null]
    .filter(Boolean)
    .join(" · ");

  return `
    <header class="day-head">
      <div class="day-head__meta">
        ${counter ? `<span class="day-head__counter">Day ${counter.n} of ${counter.of}</span>` : ""}
        ${day.date ? `<span class="day-head__date">${esc(formatDate(day.date))}</span>` : ""}
        ${where ? `<span class="day-head__where">${esc(where)}</span>` : ""}
      </div>
      <h1 class="day-head__title">${esc(day.title)}</h1>
      ${day.subtitle ? `<p class="day-head__sub">${esc(day.subtitle)}</p>` : ""}
    </header>`;
}

function daySummary(day) {
  const blocks = (day.activities || [])
    .map(
      (block) => `
      <div class="block">
        <p class="block__when">${esc(block.when)}</p>
        <ul class="block__items">
          ${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}
        </ul>
      </div>`
    )
    .join("");

  if (!blocks) return "";
  return `<section>
            <h2 class="section-title">Day summary</h2>
            ${blocks}
          </section>`;
}

function foodPlan(day) {
  if (!day.food || !day.food.length) return "";
  return `<ul class="meal__dishes">${day.food
    .map((f) => `<li class="dish">${esc(f)}</li>`)
    .join("")}</ul>`;
}

export async function dayPage({ date }) {
  const day = getDay(date);
  if (!day) {
    return `<div class="page"><p class="empty">There is no day called “${esc(date)}”.</p></div>`;
  }

  const leg = getLeg(day.leg);
  const { prev, next } = neighbours(day);

  const [media, meals, entries, bestNotes] = await Promise.all([
    mediaForDay(day),
    mealsForDay(day),
    entriesForDay(day),
    bestOfForDay(day),
  ]);

  const photos = media
    .filter((m) => m.provider !== "youtube")
    .slice(0, DAY_PHOTO_LIMIT);
  const videos = media
    .filter((m) => m.provider === "youtube")
    .slice(0, DAY_VIDEO_LIMIT);
  const unattachedPhotos = photos.filter((p) => !p.meal_id);

  const story = entries
    .filter((e) => e.kind === "text" || e.kind === "quote")
    .map((e) =>
      e.kind === "quote"
        ? `<blockquote>${esc(e.body)}</blockquote>`
        : `<div class="measure">${markdown(e.body)}</div>`
    )
    .join("");

  const cover = day.coverUrl
    ? `<div class="day-cover"><img src="${esc(day.coverUrl)}" alt=""></div>`
    : destinationHero(day.leg);

  const photosSection = unattachedPhotos.length
    ? `<section>
         <h2 class="section-title">Photos</h2>
         ${await photoAlbum(unattachedPhotos, { fallbackPlace: day.city })}
       </section>`
    : "";

  const videoSection = videos.length
    ? `<section>
         <h2 class="section-title">Video</h2>
         <div class="video-board">${videos
           .map((v) => videoEmbed(v.external_id, v.caption))
           .join("")}</div>
       </section>`
    : "";

  const plannedFood = foodPlan(day);
  const foodSection = meals.length
    ? `<section>
         <h2 class="section-title">Food</h2>
         ${await mealBoard(meals)}
       </section>`
    : plannedFood
      ? `<section>
           <h2 class="section-title">Food we are hoping to eat</h2>
           ${plannedFood}
         </section>`
      : "";

  const hasBest = (bestNotes || []).some((note) => (note.body || "").trim());
  const storySection = story
    ? `<section>
         <h2 class="section-title">The story</h2>
         ${story}
         ${bestOfSection(bestNotes)}
       </section>`
    : hasBest
      ? `<section>${bestOfSection(bestNotes)}</section>`
      : "";

  const html = `
    ${dayStrip(day.date || day.slug)}
    <div class="page stack" data-leg="${esc(day.leg)}">
      ${header(day)}
      ${cover}

      ${day.transit ? `<p class="transit"><span aria-hidden="true">🚄</span><span>${esc(day.transit)}</span></p>` : ""}
      ${day.kind === "day" ? weatherLine(day) : ""}
      ${bookings(day.bookings)}
      ${day.special ? `<p class="notice"><strong>A special one.</strong> This is the day the whole trip bends around.</p>` : ""}

      ${daySummary(day)}
      ${storySection}
      ${photosSection}
      ${videoSection}
      ${foodSection}

      ${
        day.kind === "pre"
          ? watchlistSection() + weatherTable() + packingSection()
          : ""
      }

      <nav class="day-nav" aria-label="Day navigation">
        ${
          prev
            ? `<a href="#${prev.kind === "day" ? `/day/${prev.date}` : `/${prev.slug}`}">
                 <span class="day-nav__dir">Previous</span>
                 <span class="day-nav__title">${esc(prev.title)}</span></a>`
            : "<span></span>"
        }
        ${
          next
            ? `<a href="#${next.kind === "day" ? `/day/${next.date}` : `/${next.slug}`}">
                 <span class="day-nav__dir">Next</span>
                 <span class="day-nav__title">${esc(next.title)}</span></a>`
            : "<span></span>"
        }
      </nav>

      <p class="xs muted">${esc(leg.name)} · <span class="jp">${esc(leg.jp || "")}</span>
         ${esc(leg.romaji || "")} — ${esc(leg.meaning || "")}</p>
    </div>`;

  return {
    html,
    mount(root) {
      centreActiveChip();
      bindVideos(root);
      bindPhotoGrid(root, unattachedPhotos);
      bindLiveWeather(root);
    },
  };
}

export { youtubeId };
