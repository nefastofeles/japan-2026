/* ==========================================================================
   Admin - the nightly ten minutes.
   --------------------------------------------------------------------------
   The whole design goal: never block a photo on its metadata. Pick the day,
   throw the photos at it, paste one YouTube link, log the meals if there is
   energy left. Place names and prices can be filled in weeks later.

   The forms themselves are in admin-forms.js. This file is only the wiring.
   ========================================================================== */

import { dayId, getDay, getDays, addBestOf, addStory, addVideo, addPhoto } from "../store.js";
import { isConfigured, TRIP } from "../config.js";
import { getClient } from "../supabase.js";
import { isAdmin, signOut, getSession } from "../auth.js";
import { todayISO, youtubeId } from "../util.js";
import { prepareImage } from "../media.js";
import { loginPage, adminForms } from "./admin-forms.js";

export async function adminPage() {
  if (!getSession()) return loginPage();

  if (!(await isAdmin())) {
    return `<div class="page stack">
              <p class="notice">This login can read the journal. Posting needs the admin login.</p>
            </div>`;
  }

  const today = todayISO(TRIP.timezone);
  const defaultDay = getDay(today) ? today : getDays()[0].date || getDays()[0].slug;

  return { html: adminForms(defaultDay), mount: bindAdmin };
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
    const category = pick("[data-category]").value;
    const shotBy = pick("[data-shotby]").value;
    const place = pick("[data-photo-place]").value.trim();
    let done = 0;
    let failed = 0;

    for (const file of files) {
      status.textContent = `Uploading ${done + failed + 1} of ${files.length}…`;
      try {
        const prepared = await prepareImage(file);
        await addPhoto(day, prepared, {
          category,
          shotBy,
          place: place || null,
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
    if (!failed) pick("[data-photo-place]").value = "";
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
    try {
      await addVideo(day, id, pick("[data-ytcap]").value.trim());
      status.textContent = "Video added.";
      pick("[data-yt]").value = "";
      pick("[data-ytcap]").value = "";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  /* -------------------------------------------------------------- story */
  pick("[data-addstory]").addEventListener("click", async () => {
    const status = pick("[data-story-status]");
    const body = pick("[data-story]").value.trim();
    if (!body) return;

    try {
      await addStory(
        selectedDay(),
        root.querySelector("[data-storywho]").value,
        body
      );
      status.textContent = "Story saved.";
      pick("[data-story]").value = "";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  /* ------------------------------------------------------ best of the day */
  pick("[data-addbest]").addEventListener("click", async () => {
    const status = pick("[data-best-status]");
    const day = selectedDay();
    const fields = root.querySelectorAll("[data-best]");
    const notes = [...fields]
      .map((field) => ({ personId: field.dataset.best, body: field.value.trim() }))
      .filter((note) => note.body);

    if (!notes.length) {
      status.textContent = "Write at least one note first.";
      return;
    }

    if (!isConfigured()) {
      status.textContent = "Best of the day needs the database. Photos, story and video save on this phone for now.";
      return;
    }

    status.textContent = "Saving…";
    try {
      for (const note of notes) {
        await addBestOf(day, note.personId, note.body);
      }
      status.textContent = "Saved.";
      fields.forEach((field) => (field.value = ""));
    } catch (error) {
      status.textContent = error.message;
    }
  });

  /* --------------------------------------------------------------- meal */
  pick("[data-addmeal]").addEventListener("click", async () => {
    const status = pick("[data-meal-status]");
    if (!isConfigured()) {
      status.textContent = "Meals need the database. Photos, story and video save on this phone for now.";
      return;
    }
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
