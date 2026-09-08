/* ==========================================================================
   Quest Game — one mission
   --------------------------------------------------------------------------
   Hook → action → reveal → reward. Short on the phone, long in the street.
   ========================================================================== */

import { getPeople } from "../store.js";
import { esc, todayISO } from "../util.js";
import { TRIP } from "../config.js";
import { loadQuest, missionById, chapterById, codexById, badgeById } from "../quest/content.js";
import { loadState, isComplete } from "../quest/state.js";
import {
  completeMission, missionStatus, previousAnswer,
} from "../quest/engine.js";
import { locateOnce } from "../quest/location.js";
import { saveQuestPhoto } from "../quest/photos.js";
import { questShell, peopleChecks, typeLabel } from "../components/quest-chrome.js";

function actionFields(mission) {
  if (mission.type === "photo") {
    return `
      <label for="quest-photo">Camera or library</label>
      <input class="field" id="quest-photo" type="file" accept="image/*"
             capture="environment">`;
  }
  if (mission.type === "solve") {
    return `
      <label for="quest-answer">Your answer</label>
      <input class="field" id="quest-answer" data-answer
             autocomplete="off" autocapitalize="off">`;
  }
  if (mission.type === "food" || mission.type === "reflection" || mission.type === "find" || mission.type === "observe" || mission.type === "story") {
    const label =
      mission.type === "reflection"
        ? "The sentence you want kept"
        : "What you found";
    return `
      <label for="quest-answer">${esc(label)}</label>
      <textarea class="field" id="quest-answer" data-answer rows="3"></textarea>`;
  }
  return "";
}

function rewardHtml(quest, mission) {
  const bits = [];
  if (mission.xp) bits.push(`<p><strong>+${mission.xp} family XP</strong></p>`);
  if (mission.codexUnlock) {
    const entry = codexById(quest, mission.codexUnlock);
    if (entry) {
      bits.push(
        `<p>Codex: <strong>${esc(entry.name)}</strong>
         <span class="jp">${esc(entry.japaneseName || "")}</span></p>
         <p>${esc(entry.description)}</p>`
      );
    }
  }
  if (mission.badgeUnlock) {
    const badge = badgeById(quest, mission.badgeUnlock);
    if (badge) {
      bits.push(`<p>Badge: <strong>${esc(badge.name)}</strong></p>`);
      if (badge.realWorldReward) {
        bits.push(`<p>Real world: ${esc(badge.realWorldReward)}</p>`);
      }
    }
  }
  if (mission.realWorldReward) {
    bits.push(`<p>Real world: ${esc(mission.realWorldReward)}</p>`);
  }
  return bits.join("");
}

export async function adventureMissionPage({ id }) {
  const quest = await loadQuest();
  const mission = missionById(quest, id);
  if (!mission) {
    return questShell("/adventure", `<p class="empty">That page is missing.</p>`);
  }
  const chapter = chapterById(quest, mission.chapterId);
  const state = loadState();
  const people = getPeople();
  const prior = previousAnswer(state, mission);
  const done = isComplete(state, mission.id);
  const record = state.completed[mission.id];
  const memoryTone = chapter.tone === "memory" || mission.sensitive;
  const locked = !done && missionStatus(mission, state) === "locked";

  const html = questShell(
    "/adventure",
    `
    <article class="stack quest-stage" data-tone="${memoryTone ? "memory" : ""}">
      <p class="quest-kicker">${esc(typeLabel(mission.type))} · ${esc(chapter.destination)}</p>
      <h2>${esc(mission.title)}</h2>
      ${
        prior
          ? `<p class="card">Last time you said: “${esc(prior)}”</p>`
          : ""
      }
      <p>${esc(mission.intro)}</p>
      <p><strong>${esc(mission.task)}</strong></p>
      ${
        mission.location
          ? `<p class="muted" data-gps>Near ${esc(mission.location.label)}. GPS is optional.</p>`
          : ""
      }

      ${
        done
          ? `<div class="card stack">
               <h3>Recovered</h3>
               <p>${esc(mission.reveal)}</p>
               ${record?.answer ? `<p>${esc(record.answer)}</p>` : ""}
               ${rewardHtml(quest, mission)}
               <a class="btn" href="#/adventure">Back to Quest</a>
             </div>`
          : locked
            ? `<p class="empty">Finish the previous page first. Then come back.</p>
               <p><a class="btn" href="#/adventure">Back to Quest</a></p>`
          : `<form class="stack" data-quest-form>
               <fieldset class="scores">
                 <legend class="small">Who was looking</legend>
                 ${peopleChecks(people)}
               </fieldset>
               ${actionFields(mission)}
               <p class="small" data-status role="status"></p>
               ${
                 mission.location
                   ? `<button class="btn btn--ghost" type="button" data-check-gps>Check if we are near</button>
                      <button class="btn btn--ghost" type="button" data-here>We’re here anyway</button>`
                   : ""
               }
               <button class="btn" type="submit" data-finish>We did this</button>
             </form>
             <div class="card stack" data-reveal hidden>
               <h3>The missing page</h3>
               <p data-reveal-text></p>
               <div data-reward></div>
               <a class="btn" href="#/adventure">Back to Quest</a>
             </div>`
      }
    </article>`
  );

  return {
    html,
    mount(root) {
      bindMission(root, quest, mission, state);
    },
  };
}

function bindMission(root, quest, mission, state) {
  const form = root.querySelector("[data-quest-form]");
  if (!form) return;
  const status = root.querySelector("[data-status]");
  let bypassGps = !mission.location;

  const finish = form.querySelector("[data-finish]");

  const gpsBtn = root.querySelector("[data-check-gps]");
  if (gpsBtn) {
    gpsBtn.addEventListener("click", async () => {
      status.textContent = "Looking once…";
      const here = await locateOnce();
      const gate = missionStatus(mission, state, { here });
      if (gate === "unlocked" || gate === "open") {
        status.textContent = "Close enough. Do the thing in front of you.";
        bypassGps = true;
      } else if (gate === "nearby") {
        status.textContent = "Something is nearby. Walk a little closer.";
      } else if (here.error === "denied") {
        status.textContent = "No GPS. Use We’re here when you mean it.";
      } else {
        status.textContent = "Not there yet. Keep looking around you, not at the map.";
      }
    });
  }

  const hereBtn = root.querySelector("[data-here]");
  if (hereBtn) {
    hereBtn.addEventListener("click", () => {
      bypassGps = true;
      status.textContent = "Unlocked by being there. Carry on.";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (mission.location && !bypassGps) {
      status.textContent = "Check you are near, or tap We’re here.";
      return;
    }

    const answer = form.querySelector("[data-answer]")?.value.trim() || "";
    if (mission.accepted) {
      const ok = mission.accepted.some((needle) =>
        answer.toLowerCase().includes(needle)
      );
      if (!ok) {
        status.textContent = "Not yet. Look again — the number or the word is in front of you.";
        return;
      }
    }
    if ((mission.type === "reflection" || mission.type === "solve") && !answer) {
      status.textContent = "Write something first.";
      return;
    }

    const photoInput = form.querySelector("#quest-photo");
    let photoId = null;
    if (mission.type === "photo") {
      const file = photoInput?.files?.[0];
      if (!file) {
        status.textContent = "Add a photo first.";
        return;
      }
      status.textContent = "Keeping the picture on this phone…";
      const saved = await saveQuestPhoto(file);
      photoId = saved.id;
    }

    const participants = [...form.querySelectorAll('input[name="who"]:checked')].map(
      (input) => input.value
    );

    if (finish) finish.disabled = true;
    completeMission(quest, state, mission, {
      date: todayISO(TRIP.timezone),
      answer,
      photoId,
      participants,
      locationLabel: mission.location?.label || "",
      summary: mission.title,
    });

    form.hidden = true;
    const reveal = root.querySelector("[data-reveal]");
    reveal.hidden = false;
    reveal.querySelector("[data-reveal-text]").textContent = mission.reveal;
    reveal.querySelector("[data-reward]").innerHTML = rewardHtml(quest, mission);
  });
}
