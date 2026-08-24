/* ==========================================================================
   Admin - the nightly ten minutes.
   --------------------------------------------------------------------------
   The whole design goal: never block a photo on its metadata. Pick the day,
   throw the photos at it, paste one YouTube link, log the meals if there is
   energy left. Place names and prices can be filled in weeks later.
   ========================================================================== */

import { getDays, getPeople, dayId, getDay } from "../store.js";
import { isConfigured, REACTION_EMOJI } from "../config.js";
import { getClient } from "../supabase.js";
import { isAdmin, isSignedIn, signIn, signOut, getSession } from "../auth.js";
import { esc, todayISO, youtubeId } from "../util.js";
import { prepareImage, uploadImage } from "../media.js";
import { TRIP } from "../config.js";

function loginForm(message = "") {
  return `
    <div class="page">
      <form class="login stack" data-login>
        <h1>Sign in</h1>
        <p class="small muted">Family login for viewing, admin login for posting.</p>
        <div>
          <label for="email">Email</label>
          <input class="field" id="email" name="email" type="email" required
                 autocomplete="username" inputmode="email">
        </div>
        <div>
          <label for="password">Password</label>
          <input class="field" id="password" name="password" type="password" required
                 autocomplete="current-password">
        </div>
        <button class="btn" type="submit">Sign in</button>
        <p class="small" data-login-status role="status">${esc(message)}</p>
      </form>
    </div>`;
}

function dayOptions(selected) {
  return getDays()
    .map((d) => {
      const value = d.date || d.slug;
      const label = d.date ? `${d.date} — ${d.title}` : d.title;
      return `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>
                ${esc(label)}
              </option>`;
    })
    .join("");
}

function peopleOptions() {
  return getPeople()
    .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
    .join("");
}

function adminForms(defaultDay) {
  return `
    <div class="page stack">
      <header>
        <h1>Post</h1>
        <p class="small muted">Signed in as admin.
          <button class="reaction" data-signout type="button">Sign out</button></p>
      </header>

      <div class="card stack">
        <div>
          <label for="day">Which day</label>
          <select class="field" id="day" data-day>${dayOptions(defaultDay)}</select>
        </div>
      </div>

      <section class="card stack">
        <h2 class="section-title">Photos</h2>
        <p class="small muted">
          Resized to 2000px and thumbnailed in the browser before anything is sent.
          Pick as many as you like.
        </p>
        <div>
          <label for="files">Choose photos</label>
          <input class="field" id="files" type="file" accept="image/*" multiple data-files>
        </div>
        <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
          <div>
            <label for="category">Category</label>
            <select class="field" id="category" data-category>
              <option value="place">Places</option>
              <option value="food">Food</option>
              <option value="people">Us</option>
              <option value="stamp">Stamps</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label for="shotby">Shot by</label>
            <select class="field" id="shotby" data-shotby>${peopleOptions()}</select>
          </div>
        </div>
        <button class="btn" data-upload type="button">Upload</button>
        <p class="small" data-upload-status role="status"></p>
      </section>

      <section class="card stack">
        <h2 class="section-title">Video</h2>
        <p class="small muted">
          Upload to YouTube as <strong>Unlisted</strong> from the phone, then paste the link here.
        </p>
        <div>
          <label for="yt">YouTube link</label>
          <input class="field" id="yt" data-yt placeholder="https://youtu.be/...">
        </div>
        <div>
          <label for="ytcap">Caption</label>
          <input class="field" id="ytcap" data-ytcap placeholder="Shibuya crossing at dusk">
        </div>
        <button class="btn" data-addvideo type="button">Add video</button>
        <p class="small" data-video-status role="status"></p>
      </section>

      <section class="card stack">
        <h2 class="section-title">Story</h2>
        <div>
          <label for="story">What happened today</label>
          <textarea class="field" id="story" rows="6" data-story
                    placeholder="Five sentences is plenty. **Bold** and *italic* work."></textarea>
        </div>
        <div>
          <label for="storywho">Written by</label>
          <select class="field" id="storywho" data-storywho>${peopleOptions()}</select>
        </div>
        <button class="btn" data-addstory type="button">Save story</button>
        <p class="small" data-story-status role="status"></p>
      </section>

      <section class="card stack">
        <h2 class="section-title">Meal</h2>
        <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
          <div>
            <label for="slot">When</label>
            <select class="field" id="slot" data-slot>
              <option value="breakfast">Breakfast</option>
              <option value="lunch" selected>Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="konbini">Konbini</option>
            </select>
          </div>
          <div>
            <label for="price">Price (yen)</label>
            <input class="field" id="price" type="number" inputmode="numeric" data-price>
          </div>
        </div>
        <div>
          <label for="place">Where</label>
          <input class="field" id="place" data-place placeholder="Fuunji">
        </div>
        <div>
          <label for="dishes">Dishes, comma separated</label>
          <input class="field" id="dishes" data-dishes placeholder="Tsukemen, gyoza">
        </div>
        <fieldset style="border:1px solid var(--rule);border-radius:var(--radius);padding:var(--sp-4)">
          <legend class="small">Scores out of 5</legend>
          ${getPeople()
            .map(
              (p) => `<label style="display:flex;gap:var(--sp-3);align-items:center;font-weight:500">
                        ${esc(p.name)}
                        <input class="field" style="max-width:6rem" type="number" min="1" max="5"
                               data-score="${esc(p.id)}">
                      </label>`
            )
            .join("")}
        </fieldset>
        <button class="btn" data-addmeal type="button">Save meal</button>
        <p class="small" data-meal-status role="status"></p>
      </section>
    </div>`;
}

export async function adminPage() {
  if (!isConfigured()) {
    return `<div class="page"><p class="notice"><strong>Supabase is not configured.</strong>
            Fill in the two values in <code>js/config.js</code> first. See SETUP.md.</p></div>`;
  }

  if (!getSession()) {
    return {
      html: loginForm(),
      mount: bindLogin,
    };
  }

  if (!(await isAdmin())) {
    return `<div class="page stack">
              <p class="notice">You are signed in as a viewer, which is the right account
              for reading the site. Posting needs the admin login.</p>
              <p><button class="btn btn--ghost" onclick="location.reload()">Reload</button></p>
            </div>`;
  }

  const today = todayISO(TRIP.timezone);
  const defaultDay = getDay(today) ? today : getDays()[0].date || getDays()[0].slug;

  return { html: adminForms(defaultDay), mount: bindAdmin };
}

function bindLogin(root) {
  const form = root.querySelector("[data-login]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-login-status]");
    status.textContent = "Signing in…";
    try {
      await signIn(form.elements.email.value, form.elements.password.value);
      location.reload();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

function bindAdmin(root) {
  const pick = (sel) => root.querySelector(sel);
  const selectedDay = () => getDay(pick("[data-day]").value);

  root.querySelector("[data-signout]").addEventListener("click", async () => {
    await signOut();
    location.reload();
  });

  /* ------------------------------------------------------------- photos */
  pick("[data-upload]").addEventListener("click", async () => {
    const status = pick("[data-upload-status]");
    const files = Array.from(pick("[data-files]").files || []);
    if (!files.length) {
      status.textContent = "Pick some photos first.";
      return;
    }

    const day = selectedDay();
    const id = await dayId(day);
    if (!id) {
      status.textContent = "That day is not in the database yet. Run 04_seed.sql.";
      return;
    }

    const category = pick("[data-category]").value;
    const shotBy = pick("[data-shotby]").value;
    let done = 0;
    let failed = 0;

    for (const file of files) {
      status.textContent = `Uploading ${done + failed + 1} of ${files.length}…`;
      try {
        const prepared = await prepareImage(file);
        await uploadImage(prepared, {
          dayId: id,
          dayDate: day.date,
          category,
          shotBy,
          personId: shotBy,
        });
        done += 1;
      } catch (error) {
        console.error(file.name, error);
        failed += 1;
      }
    }

    status.textContent = `Uploaded ${done} of ${files.length}.` +
      (failed ? ` ${failed} failed, try those again.` : "");
    pick("[data-files]").value = "";
  });

  /* -------------------------------------------------------------- video */
  pick("[data-addvideo]").addEventListener("click", async () => {
    const status = pick("[data-video-status]");
    const id = youtubeId(pick("[data-yt]").value);
    if (!id) {
      status.textContent = "That does not look like a YouTube link.";
      return;
    }

    const day = selectedDay();
    const dbDay = await dayId(day);
    const supabase = await getClient();
    const { error } = await supabase.from("media").insert({
      day_id: dbDay,
      provider: "youtube",
      external_id: id,
      category: "other",
      caption: pick("[data-ytcap]").value || null,
    });

    status.textContent = error ? error.message : "Video added.";
    if (!error) {
      pick("[data-yt]").value = "";
      pick("[data-ytcap]").value = "";
    }
  });

  /* -------------------------------------------------------------- story */
  pick("[data-addstory]").addEventListener("click", async () => {
    const status = pick("[data-story-status]");
    const body = pick("[data-story]").value.trim();
    if (!body) return;

    const dbDay = await dayId(selectedDay());
    const supabase = await getClient();
    const { error } = await supabase.from("entries").insert({
      day_id: dbDay,
      person_id: root.querySelector("[data-storywho]").value,
      kind: "text",
      body,
    });

    status.textContent = error ? error.message : "Story saved.";
    if (!error) pick("[data-story]").value = "";
  });

  /* --------------------------------------------------------------- meal */
  pick("[data-addmeal]").addEventListener("click", async () => {
    const status = pick("[data-meal-status]");
    const dbDay = await dayId(selectedDay());
    const supabase = await getClient();

    const dishes = pick("[data-dishes]").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((en) => ({ en }));

    const { data, error } = await supabase
      .from("meals")
      .insert({
        day_id: dbDay,
        slot: pick("[data-slot]").value,
        place_name: pick("[data-place]").value || null,
        price_yen: Number(pick("[data-price]").value) || null,
        dishes,
      })
      .select("id")
      .single();

    if (error) {
      status.textContent = error.message;
      return;
    }

    const scores = root.querySelectorAll("[data-score]");
    const ratings = [];
    scores.forEach((input) => {
      const score = Number(input.value);
      if (score >= 1 && score <= 5) {
        ratings.push({ meal_id: data.id, person_id: input.dataset.score, score });
      }
    });
    if (ratings.length) await supabase.from("meal_ratings").insert(ratings);

    status.textContent = "Meal saved.";
    pick("[data-place]").value = "";
    pick("[data-dishes]").value = "";
    pick("[data-price]").value = "";
    scores.forEach((i) => (i.value = ""));
  });
}

export { isSignedIn, REACTION_EMOJI };
