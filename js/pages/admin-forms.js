/* ==========================================================================
   Admin - the markup half.
   --------------------------------------------------------------------------
   Only strings live here. Nothing in this file talks to Supabase or listens
   for a click; that is all in admin.js. Keeping them apart means you can
   redesign the forms without going anywhere near the upload logic.

   Every control is found later by its data- attribute, so if you rename one
   here, rename it in admin.js too.
   ========================================================================== */

import { getDays, getPeople } from "../store.js";
import { esc } from "../util.js";

export function loginForm(message = "") {
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

function photoSection() {
  return `
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
      <div class="row-wrap">
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
    </section>`;
}

function videoSection() {
  return `
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
      <div class="row-wrap">
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

      ${photoSection()}
      ${videoSection()}
      ${storySection()}
      ${mealSection()}
    </div>`;
}
