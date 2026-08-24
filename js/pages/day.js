/* ==========================================================================
   Day page
   --------------------------------------------------------------------------
   One template for all 24 pages. The pre-trip and post-trip pages are just
   days with kind "pre" and "post", so they get the same layout, the same
   editor and the same upload flow with no extra code paths.
   ========================================================================== */

import {
  getDay, neighbours, dayNumber, getLeg,
  mediaForDay, mealsForDay, entriesForDay, commentsForDay, addComment,
} from "../store.js";
import { esc, formatDate, youtubeId, relativeTime } from "../util.js";
import { isConfigured } from "../config.js";
import { dayStrip, centreActiveChip } from "../components/day-strip.js";
import { bookings } from "../components/booking-card.js";
import { videoEmbed, bindVideos } from "../components/video-embed.js";
import { photoGrid, bindPhotoGrid } from "../components/photo-grid.js";
import { mealList } from "../components/meal-card.js";
import { markdown } from "../components/markdown.js";
import {
  weatherLine, watchlistSection, packingSection, weatherTable,
} from "../components/reference.js";

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

function plan(day) {
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
            <h2 class="section-title">The plan</h2>
            ${blocks}
          </section>`;
}

function foodPlan(day) {
  if (!day.food || !day.food.length) return "";
  return `<ul class="meal__dishes">${day.food
    .map((f) => `<li class="dish">${esc(f)}</li>`)
    .join("")}</ul>`;
}

function commentForm() {
  if (!isConfigured()) return "";
  return `
    <form class="card stack" data-comment-form>
      <div>
        <label for="c-name">Your name</label>
        <input class="field" id="c-name" name="name" required maxlength="40"
               placeholder="Farmor" autocomplete="name">
      </div>
      <div>
        <label for="c-body">Say something</label>
        <textarea class="field" id="c-body" name="body" required rows="3"
                  placeholder="That bowl of ramen looks unbelievable"></textarea>
      </div>
      <button class="btn" type="submit">Leave a comment</button>
      <p class="small muted" data-comment-status role="status"></p>
    </form>`;
}

export async function dayPage({ date }) {
  const day = getDay(date);
  if (!day) {
    return `<div class="page"><p class="empty">There is no day called “${esc(date)}”.</p></div>`;
  }

  const leg = getLeg(day.leg);
  const { prev, next } = neighbours(day);

  // The plan renders immediately; the memories only exist once Supabase is set
  // up, and every one of these degrades to an empty list before then.
  const [media, meals, entries, comments] = await Promise.all([
    mediaForDay(day),
    mealsForDay(day),
    entriesForDay(day),
    commentsForDay(day),
  ]);

  const photos = media.filter((m) => m.provider !== "youtube");
  const videos = media.filter((m) => m.provider === "youtube");
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
    : "";

  const html = `
    ${dayStrip(day.date || day.slug)}
    <div class="page stack" data-leg="${esc(day.leg)}">
      ${header(day)}
      ${cover}

      ${day.transit ? `<p class="transit"><span aria-hidden="true">🚄</span><span>${esc(day.transit)}</span></p>` : ""}
      ${day.kind === "day" ? weatherLine(day.leg) : ""}
      ${bookings(day.bookings)}
      ${day.special ? `<p class="notice"><strong>A special one.</strong> This is the day the whole trip bends around.</p>` : ""}

      ${story ? `<section><h2 class="section-title">The story</h2>${story}</section>` : ""}

      <section>
        <h2 class="section-title">Photos</h2>
        ${await photoGrid(unattachedPhotos, {
          emptyMessage: isConfigured()
            ? "No photos on this day yet."
            : "Photos appear here once Supabase is connected.",
        })}
      </section>

      ${
        videos.length
          ? `<section><h2 class="section-title">Video</h2>
             <div class="stack">${videos
               .map((v) => videoEmbed(v.external_id, v.caption))
               .join("")}</div></section>`
          : ""
      }

      <section>
        <h2 class="section-title">Food</h2>
        ${meals.length ? await mealList(meals) : foodPlan(day) || await mealList([])}
      </section>

      ${plan(day)}

      ${
        day.kind === "pre"
          ? watchlistSection() + weatherTable() + packingSection()
          : ""
      }

      <section>
        <h2 class="section-title">Comments</h2>
        <div class="stack">
          ${
            comments.length
              ? comments
                  .map(
                    (c) => `<div class="comment">
                              <p class="comment__who">${esc(c.author_name)}
                                <span class="comment__when">${esc(relativeTime(c.created_at))}</span>
                              </p>
                              <p>${esc(c.body)}</p>
                            </div>`
                  )
                  .join("")
              : `<p class="empty">No comments yet.</p>`
          }
          ${commentForm()}
        </div>
      </section>

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

      const form = root.querySelector("[data-comment-form]");
      if (form) {
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const status = form.querySelector("[data-comment-status]");
          const name = form.elements.name.value.trim();
          const body = form.elements.body.value.trim();
          if (!name || !body) return;

          status.textContent = "Sending…";
          try {
            await addComment(day, name, body);
            status.textContent = "Thank you. Reload to see it.";
            form.reset();
          } catch (error) {
            status.textContent = `Could not send: ${error.message}`;
          }
        });
      }
    },
  };
}

export { youtubeId };
