/* ==========================================================================
   Admin - the nightly ten minutes.
   --------------------------------------------------------------------------
   The whole design goal: never block a photo on its metadata. Pick the day,
   throw the photos at it, paste one YouTube link, log the meals if there is
   energy left. Place names and prices can be filled in weeks later.

   The forms themselves are in admin-forms.js. This file is only the wiring.
   ========================================================================== */

import { getDay, getDays } from "../store.js";
import { addBestOf, addStory, addVideo, addMeal } from "../posts.js";
import { isConfigured, TRIP } from "../config.js";
import { isAdmin, signOut, getSession } from "../auth.js";
import { todayISO, youtubeId } from "../util.js";
import { prepareImage } from "../media.js";
import { adminForms, photoBatchMarkup } from "./admin-forms.js";
import { loginPage } from "./login.js";
import { resetQuestState } from "../quest/reset.js";
import { uploadPhotoFiles } from "../components/photo-upload.js";

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

  pick("[data-signout]").addEventListener("click", async () => {
    await signOut();
    location.reload();
  });

  /* ------------------------------------------------------------- photos */
  const batches = pick("[data-photo-batches]");
  pick("[data-add-batch]").addEventListener("click", () => {
    batches.insertAdjacentHTML("beforeend", photoBatchMarkup(true));
  });
  batches.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-batch]");
    if (!button) return;
    button.closest("[data-photo-batch]").remove();
    if (!batches.querySelector("[data-photo-batch]")) {
      batches.insertAdjacentHTML("beforeend", photoBatchMarkup(false));
    }
  });

  batches.addEventListener("change", (event) => {
    const input = event.target.closest("[data-files]");
    if (!input) return;
    const note = input.parentElement.querySelector("[data-file-list]");
    if (!note) return;
    const files = Array.from(input.files || []);
    note.textContent = files.length
      ? files.map((file) => `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`).join(" · ")
      : "";
  });

  pick("[data-upload]").addEventListener("click", async () => {
    const status = pick("[data-upload-status]");
    const groups = [...batches.querySelectorAll("[data-photo-batch]")].map((batch) => ({
      files: Array.from(batch.querySelector("[data-files]").files || []),
      place: batch.querySelector("[data-photo-place]").value.trim(),
      category: batch.querySelector("[data-photo-category]").value,
    }));
    const total = groups.reduce((sum, group) => sum + group.files.length, 0);
    if (!total) {
      status.textContent = "Pick some photos first.";
      return;
    }

    const day = selectedDay();
    let done = 0;
    let failed = 0;
    let lastError = "";

    for (const group of groups) {
      const result = await uploadPhotoFiles(
        day,
        group.files,
        { category: group.category, place: group.place || null },
        (n) => {
          status.textContent = `Uploading ${done + failed + n} of ${total}…`;
        }
      );
      done += result.done;
      failed += result.failed;
      if (result.lastError) lastError = result.lastError;
    }

    status.textContent = `Uploaded ${done} of ${total}.` +
      (failed ? ` ${failed} failed. ${lastError}` : " They are in the shared album. Open Photos on any signed-in phone.");
    batches.querySelectorAll("[data-files]").forEach((input) => {
      input.value = "";
    });
    batches.querySelectorAll("[data-file-list]").forEach((note) => {
      note.textContent = "";
    });
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
    const files = Array.from(pick("[data-meal-files]").files || []).slice(0, 3);
    const dishes = pick("[data-dishes]").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((en) => ({ en }));

    const ratings = [];
    root.querySelectorAll("[data-score]").forEach((input) => {
      const score = Number(input.value);
      if (score >= 1 && score <= 5) {
        ratings.push({ person_id: input.dataset.score, score });
      }
    });

    status.textContent = "Saving…";
    try {
      const photos = [];
      for (const file of files) photos.push(await prepareImage(file));
      await addMeal(selectedDay(), {
        slot: pick("[data-slot]").value,
        placeName: pick("[data-place]").value.trim(),
        priceYen: Number(pick("[data-price]").value) || null,
        dishes,
        ratings,
        photos,
      });
      status.textContent = "Meal saved.";
      pick("[data-place]").value = "";
      pick("[data-dishes]").value = "";
      pick("[data-price]").value = "";
      pick("[data-meal-files]").value = "";
      root.querySelectorAll("[data-score]").forEach((i) => {
        i.value = "";
      });
    } catch (error) {
      status.textContent = error.message;
    }
  });

  pick("[data-reset-quest]").addEventListener("click", async () => {
    const status = pick("[data-reset-status]");
    const ok =
      window.confirm("This clears Quest progress on this phone. If you are signed in as the facilitator it also clears the shared copy. It cannot be undone.") &&
      window.confirm("Really start the Quest over?");
    if (!ok) return;
    status.textContent = "Clearing…";
    await resetQuestState();
    status.textContent = "Quest progress cleared on this phone.";
  });
}
