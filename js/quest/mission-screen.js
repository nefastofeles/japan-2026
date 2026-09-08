/**
 * Reusable mission / memory / discovery screens.
 *
 * One short block at a time. Listen sits under the title. Hint stays
 * hidden until asked. Hiroshima uses the same structure with quiet labels.
 */

import { esc } from "../util.js";
import {
  questShell, typeMark, peopleChecks, listenBar,
  memoryLabels, playLabels,
} from "../components/quest-chrome.js";
import { isMemoryMode, memoryPlace, isComplete } from "./engine.js";
import { codexById, badgeById } from "./content.js";

export function screenLabels(quest, mission, chapter) {
  if (isMemoryMode(chapter, mission)) {
    return memoryLabels(memoryPlace(quest, mission));
  }
  return playLabels(mission.type);
}

function actionFields(mission) {
  if (mission.type === "photo") {
    return `
      <label class="quest-label" for="quest-photo">Photo</label>
      <input class="field" id="quest-photo" type="file" accept="image/*"
             capture="environment">`;
  }
  if (mission.type === "solve") {
    return `
      <label class="quest-label" for="quest-answer">Your answer</label>
      <input class="field" id="quest-answer" data-answer
             autocomplete="off" autocapitalize="off">`;
  }
  if (["food", "reflection", "find", "observe", "story"].includes(mission.type)) {
    const label = mission.type === "reflection" ? "The sentence to keep" : "What you found";
    return `
      <label class="quest-label" for="quest-answer">${esc(label)}</label>
      <textarea class="field" id="quest-answer" data-answer rows="3"></textarea>`;
  }
  return "";
}

export function rewardHtml(quest, mission, labels) {
  const bits = [];
  if (labels.showXp && mission.xp) {
    bits.push(`<p class="quest-xp">+${mission.xp} family XP</p>`);
  }
  if (mission.codexUnlock) {
    const entry = codexById(quest, mission.codexUnlock);
    if (entry) {
      bits.push(
        `<p>Codex: <strong>${esc(entry.name)}</strong>
         <span class="jp">${esc(entry.japaneseName || "")}</span></p>`
      );
    }
  }
  if (labels.showBadge && mission.badgeUnlock) {
    const badge = badgeById(quest, mission.badgeUnlock);
    if (badge) bits.push(`<p>Badge: <strong>${esc(badge.name)}</strong></p>`);
  }
  if (labels.showBadge && mission.realWorldReward) {
    bits.push(`<p>${esc(mission.realWorldReward)}</p>`);
  }
  return bits.join("");
}

export function renderMissionPage({ quest, mission, chapter, state, people, locked, prior }) {
  const labels = screenLabels(quest, mission, chapter);
  const memory = isMemoryMode(chapter, mission);
  const done = isComplete(state, mission.id);
  const record = state.completed[mission.id];
  const steps = mission.storySteps || [];
  const start = locked ? "locked" : done ? "reveal" : steps.length ? "story" : "hook";

  const body = `
    <article class="stack quest-stage" data-tone="${memory ? "memory" : ""}"
             data-start="${esc(start)}">
      ${typeMark(memory ? "memory" : mission.type)}
      <p class="quest-kicker">${esc(labels.kicker)} · ${esc(chapter.destination)}</p>
      <h2>${esc(mission.title)}</h2>

      <section class="quest-panel${start === "story" ? " is-on" : ""}" data-panel="story">
        ${listenBar("story")}
        <div class="quest-prose" data-story-text></div>
        <div class="quest-choices" data-story-choices></div>
        <p class="quest-prose" data-story-response hidden></p>
        <button class="btn" type="button" data-story-next>Next</button>
      </section>

      <section class="quest-panel${start === "locked" ? " is-on" : ""}" data-panel="locked">
        <div class="quest-prose"><p>Finish the previous page first. Then come back.</p></div>
        <a class="btn" href="#/adventure">${esc(labels.continueLabel)}</a>
      </section>

      <section class="quest-panel${start === "hook" ? " is-on" : ""}" data-panel="hook">
        ${listenBar("hook")}
        <div class="quest-prose"><p>${esc(mission.intro)}</p></div>
        ${prior ? `<p class="quest-hint">Last time you said: ${esc(prior)}</p>` : ""}
        <button class="btn" type="button" data-to-task>${esc(labels.yourMission)}</button>
      </section>

      <section class="quest-panel" data-panel="task">
        <p class="quest-label">${esc(labels.yourMission)}</p>
        ${listenBar("task")}
        <div class="quest-prose"><p>${esc(mission.task)}</p></div>
        <form class="stack" data-quest-form>
          <fieldset class="scores">
            <legend class="quest-label">Who was looking</legend>
            ${peopleChecks(people)}
          </fieldset>
          ${actionFields(mission)}
          <p class="quest-prose" data-status role="status"></p>
          ${
            mission.hint
              ? `<button class="btn btn--ghost" type="button" data-show-hint>Need a hint?</button>
                 <p class="quest-hint" data-hint hidden>${esc(mission.hint)}</p>`
              : ""
          }
          ${
            mission.location
              ? `<p class="quest-prose">Near ${esc(mission.location.label)}.</p>
                 <button class="btn btn--ghost" type="button" data-check-gps>Check if we are near</button>
                 <button class="btn btn--ghost" type="button" data-here>We are here</button>`
              : ""
          }
          <button class="btn" type="submit" data-finish>${esc(labels.finish)}</button>
        </form>
      </section>

      <section class="quest-panel${start === "reveal" ? " is-on" : ""}" data-panel="reveal">
        <p class="quest-label">${esc(done ? labels.doneTitle : labels.revealTitle)}</p>
        ${listenBar("reveal")}
        <div class="quest-prose">
          <p data-reveal-text>${esc(mission.reveal)}</p>
          ${record?.answer ? `<p>${esc(record.answer)}</p>` : ""}
        </div>
        <div data-reward>${done ? rewardHtml(quest, mission, labels) : ""}</div>
        <a class="btn" href="#/adventure">${esc(labels.continueLabel)}</a>
      </section>
    </article>`;

  return questShell("/adventure", body);
}

export function renderDiscoveryPage({ quest, discovery, chapter, entry, people, found }) {
  const labels = playLabels("discovery");
  const body = `
    <article class="stack quest-stage">
      ${typeMark("discovery")}
      <p class="quest-kicker">Discovery · ${esc(chapter?.destination || "")}</p>
      <h2>${esc(discovery.name)}</h2>
      ${
        found
          ? `<section class="quest-panel is-on">
               ${listenBar("reveal")}
               <div class="quest-prose"><p>${esc(discovery.reveal || entry?.description || "")}</p></div>
               <p class="quest-xp">+${discovery.xp || 0} family XP</p>
               <a class="btn" href="#/adventure/codex">${esc(labels.continueLabel)}</a>
             </section>`
          : `<section class="quest-panel is-on" data-panel="hook">
               ${listenBar("hook")}
               <div class="quest-prose"><p>${esc(discovery.hook)}</p></div>
               <button class="btn" type="button" data-to-task>We found this</button>
             </section>
             <section class="quest-panel" data-panel="task">
               ${listenBar("task")}
               <div class="quest-prose"><p>${esc(discovery.reveal || entry?.description || "")}</p></div>
               ${
                 discovery.hint
                   ? `<button class="btn btn--ghost" type="button" data-show-hint>Need a hint?</button>
                      <p class="quest-hint" data-hint hidden>${esc(discovery.hint)}</p>`
                   : ""
               }
               <form class="stack" data-quest-form>
                 <fieldset class="scores">
                   <legend class="quest-label">Who found it</legend>
                   ${peopleChecks(people)}
                 </fieldset>
                 <button class="btn" type="submit">${esc(labels.finish)}</button>
               </form>
             </section>
             <section class="quest-panel" data-panel="reveal">
               ${listenBar("reveal")}
               <div class="quest-prose"><p data-reveal-text></p></div>
               <p class="quest-xp">+${discovery.xp || 0} family XP</p>
               <p>Added to Codex.</p>
               <a class="btn" href="#/adventure/codex">${esc(labels.continueLabel)}</a>
             </section>`
      }
    </article>`;
  return questShell("/adventure/codex", body);
}

export function missionSpeech(mission, stepText = "") {
  return {
    hook: mission.intro,
    task: mission.task,
    reveal: mission.reveal,
    story: stepText || (mission.storySteps?.[0]?.text || mission.intro),
  };
}

export function discoverySpeech(discovery, entry) {
  const detail = discovery.reveal || entry?.description || "";
  return {
    hook: discovery.hook,
    task: detail,
    reveal: detail,
  };
}
