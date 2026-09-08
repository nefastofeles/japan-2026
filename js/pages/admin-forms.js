/* ==========================================================================
   Admin - the markup half.
   --------------------------------------------------------------------------
   Markup for the login screen and the posting forms. The login submit
   handler lives here so the lock screen can run before the rest of the
   journal is loaded. Upload wiring stays in admin.js.

   Every control is found later by its data- attribute, so if you rename one
   here, rename it in admin.js too.
   ========================================================================== */

import { getDays, getPeople } from "../store.js";
import { signIn } from "../auth.js";
import { esc } from "../util.js";

export function loginForm(message = "") {
  return `
    <div class="page">
      <form class="login stack" data-login>
        <h1>Sign in</h1>
        <p class="small muted">This journal is private. Nothing inside is shown
          until you sign in.</p>
        <div>
          <label for="user">Username</label>
          <input class="field" id="user" name="user" type="text" required
                 autocomplete="username" autocapitalize="off" spellcheck="false">
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

export function loginPage(message = "") {
  return { html: loginForm(message), mount: bindLogin };
}

export function bindLogin(root) {
  const form = root.querySelector("[data-login]");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-login-status]");
    status.textContent = "Signing in…";
    try {
      await signIn(form.elements.user.value, form.elements.password.value);
      location.reload();
    } catch (error) {
      status.textContent = error.message;
    }
  });
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

export function photoBatchMarkup(canRemove) {
  return `
    <div class="photo-batch stack" data-photo-batch>
      <div>
        <label>Photos for one place</label>
        <input class="field" type="file" accept="image/*" multiple data-files>
      </div>
      <div>
        <label>Place</label>
        <input class="field" data-photo-place placeholder="Kaminarimon, Asakusa">
      </div>
      <div>
        <label>Kind</label>
        <select class="field" data-photo-category>
          <option value="place">Places</option>
          <option value="people">Us</option>
          <option value="other">Other</option>
        </select>
      </div>
      ${
        canRemove
          ? `<button type="button" class="btn btn--ghost" data-remove-batch>Remove this place</button>`
          : ""
      }
    </div>`;
}

function photoSection() {
  return `
    <section class="card stack">
      <h2 class="section-title">Photos</h2>
      <p class="small muted">
        Add a place, pick the photos from there, then add another place if you
        need to. Location from the iPhone is kept and shown on the map link.
        Food photos belong in the meal section below.
      </p>
      <div class="stack" data-photo-batches>${photoBatchMarkup(false)}</div>
      <button class="btn btn--ghost" type="button" data-add-batch>Add another place</button>
      <button class="btn" data-upload type="button">Upload photos</button>
      <p class="small" data-upload-status role="status"></p>
    </section>`;
}

function videoSection() {
  return `
    <section class="card stack">
      <h2 class="section-title">Video</h2>
      <p class="small muted">
        Upload to YouTube as <strong>Unlisted</strong> from the phone, then paste the link here.
        A day page shows up to 12 videos.
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
    </section>`;
}

function storySection() {
  return `
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
    </section>`;
}

function bestOfSection() {
  const fields = getPeople()
    .map(
      (p) => `<div>
                <label for="best-${esc(p.id)}">${esc(p.name)}</label>
                <textarea class="field" id="best-${esc(p.id)}" rows="2"
                          data-best="${esc(p.id)}"
                          placeholder="The one thing from today."></textarea>
              </div>`
    )
    .join("");

  return `
    <section class="card stack">
      <h2 class="section-title">The best of the day</h2>
      <p class="small muted">One short note from each of us. Text only.</p>
      ${fields}
      <button class="btn" data-addbest type="button">Save the best of the day</button>
      <p class="small" data-best-status role="status"></p>
    </section>`;
}

function mealSection() {
  const scores = getPeople()
    .map(
      (p) => `<label class="score-row">
                ${esc(p.name)}
                <input class="field score-row__input" type="number" min="1" max="5"
                       data-score="${esc(p.id)}">
              </label>`
    )
    .join("");

  return `
    <section class="card stack">
      <h2 class="section-title">Meal</h2>
      <p class="small muted">Breakfast, lunch, dinner or a snack. Photos of the meal stay in Food, not in Photos. Up to 3.</p>
      <div class="row-wrap">
        <div>
          <label for="slot">When</label>
          <select class="field" id="slot" data-slot>
            <option value="breakfast">Breakfast</option>
            <option value="lunch" selected>Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
            <option value="konbini">Snack / konbini</option>
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
      <div>
        <label for="mealfiles">Photos of this meal</label>
        <input class="field" id="mealfiles" type="file" accept="image/*" multiple data-meal-files>
      </div>
      <fieldset class="scores">
        <legend class="small">Scores out of 5</legend>
        ${scores}
      </fieldset>
      <button class="btn" data-addmeal type="button">Save meal</button>
      <p class="small" data-meal-status role="status"></p>
    </section>`;
}

export function adminForms(defaultDay) {
  return `
    <div class="page stack">
      <header>
        <h1>Admin</h1>
        <p class="small muted">Add the day's photos, story and videos.
          <button class="reaction" data-signout type="button">Sign out</button></p>
      </header>

      <div class="card stack">
        <div>
          <label for="day">Which day</label>
          <select class="field" id="day" data-day>${dayOptions(defaultDay)}</select>
        </div>
      </div>

      ${photoSection()}
      ${storySection()}
      ${videoSection()}
      ${bestOfSection()}
      ${mealSection()}
    </div>`;
}
