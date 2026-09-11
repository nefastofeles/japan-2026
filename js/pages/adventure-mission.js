/* ==========================================================================
   Quest Game — one mission
   --------------------------------------------------------------------------
   Hook or story beats, then one task screen, then a short reveal.
   ========================================================================== */

import { getPeople } from "../store.js";
import { esc, todayISO } from "../util.js";
import { TRIP } from "../config.js";
import { loadQuest, missionById, chapterById } from "../quest/content.js";
import { hydrateQuestState } from "../quest/sync.js";
import { loadState } from "../quest/state.js";
import {
  completeMission, missionStatus, previousAnswer,
} from "../quest/engine.js";
import { locateOnce } from "../quest/location.js";
import { saveQuestPhoto } from "../quest/photos.js";
import { questShell, wireListen } from "../components/quest-chrome.js";
import {
  renderMissionPage, rewardHtml, screenLabels, missionSpeech,
} from "../quest/mission-screen.js";
import { bindMoreInfo } from "../quest/visual.js";
import { isChoiceMission, gradeChoice } from "../quest/choices.js";

export async function adventureMissionPage({ id }) {
  const quest = await loadQuest();
  await hydrateQuestState();
  const mission = missionById(quest, id);
  if (!mission) {
    return questShell("/adventure", `<p class="empty">That page is missing.</p>`);
  }
  const chapter = chapterById(quest, mission.chapterId);
  const state = loadState();
  const people = getPeople();
  const prior = previousAnswer(state, mission);
  const locked = !state.completed[mission.id] && missionStatus(mission, state) === "locked";

  return {
    html: renderMissionPage({ quest, mission, chapter, state, people, locked, prior }),
    mount(root) {
      bindMission(root, quest, mission, chapter, state);
    },
  };
}

function showPanel(root, name) {
  root.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("is-on", panel.dataset.panel === name);
  });
}

function bindStory(root, mission, texts) {
  const steps = mission.storySteps || [];
  if (!steps.length) return;
  const textEl = root.querySelector("[data-story-text]");
  const choiceEl = root.querySelector("[data-story-choices]");
  const nextBtn = root.querySelector("[data-story-next]");
  let index = 0;
  let waiting = false;

  const paint = () => {
    const step = steps[index];
    if (!step) {
      showPanel(root, "task");
      return;
    }
    waiting = Boolean(step.choices?.length);
    texts.story = step.text;
    textEl.innerHTML = `<p>${esc(step.text)}</p>`;
    choiceEl.innerHTML = (step.choices || [])
      .map(
        (choice) =>
          `<button type="button" class="quest-choice" data-choice="${esc(choice.id)}">${esc(choice.label)}</button>`
      )
      .join("");
    if (nextBtn) nextBtn.hidden = waiting;
  };

  choiceEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-choice]");
    if (!button) return;
    const step = steps[index];
    const choice = (step.choices || []).find((item) => item.id === button.dataset.choice);
    if (!choice) return;
    texts.story = choice.response;
    textEl.innerHTML = `<p>${esc(choice.response)}</p>`;
    choiceEl.innerHTML = "";
    const answer = root.querySelector("[data-answer]");
    if (answer && !answer.value) answer.value = choice.label;
    waiting = false;
    if (nextBtn) nextBtn.hidden = false;
  });

  nextBtn?.addEventListener("click", () => {
    if (waiting) return;
    index += 1;
    paint();
  });

  paint();
}

function bindQuestion(root, mission) {
  if (!isChoiceMission(mission)) return;
  const box = root.querySelector("[data-question]");
  const finish = root.querySelector("[data-finish]");
  const feedback = root.querySelector("[data-choice-feedback]");
  const hidden = root.querySelector("[data-choice-answer]");
  if (!box) return;
  box.addEventListener("click", (event) => {
    const button = event.target.closest("[data-choice-id]");
    if (!button) return;
    if (box.dataset.locked === "true") return;
    box.querySelectorAll("[data-choice-id]").forEach((item) => {
      item.removeAttribute("aria-pressed");
    });
    button.setAttribute("aria-pressed", "true");
    const result = gradeChoice(mission.question, button.getAttribute("data-choice-id"));
    if (hidden) hidden.value = result.choice?.text || "";
    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = result.response;
    }
    if (!result.retry) {
      box.dataset.locked = "true";
      box.querySelectorAll("[data-choice-id]").forEach((item) => {
        item.disabled = true;
      });
    }
    if (finish) finish.disabled = !(result.correct || !result.retry);
  });
}

function bindMission(root, quest, mission, chapter, state) {
  const texts = missionSpeech(mission);
  wireListen(root, texts);
  bindStory(root, mission, texts);
  bindMoreInfo(root, texts, mission.moreInfo);
  bindQuestion(root, mission);

  root.querySelector("[data-to-task]")?.addEventListener("click", () => {
    showPanel(root, "task");
  });
  root.querySelector("[data-show-hint]")?.addEventListener("click", (event) => {
    const hint = root.querySelector("[data-hint]");
    if (hint) hint.hidden = false;
    event.currentTarget.hidden = true;
  });

  const form = root.querySelector("[data-quest-form]");
  if (!form) return;
  const status = root.querySelector("[data-status]");
  let bypassGps = !mission.location;
  const labels = screenLabels(quest, mission, chapter);

  root.querySelector("[data-check-gps]")?.addEventListener("click", async () => {
    status.textContent = "Looking once…";
    const here = await locateOnce();
    const gate = missionStatus(mission, state, { here });
    if (gate === "unlocked" || gate === "open") {
      status.textContent = "Close enough. Do the thing in front of you.";
      bypassGps = true;
    } else if (gate === "nearby") {
      status.textContent = "Something is nearby. Walk a little closer.";
    } else if (here.error === "denied") {
      status.textContent = "No GPS. Use We are here when you mean it.";
    } else {
      status.textContent = "Not there yet. Keep looking around you.";
    }
  });

  root.querySelector("[data-here]")?.addEventListener("click", () => {
    bypassGps = true;
    status.textContent = "Unlocked by being there.";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (mission.location && !bypassGps) {
      status.textContent = "Check you are near, or tap We are here.";
      return;
    }
    const answer = form.querySelector("[data-answer]")?.value.trim() || "";
    const choiceId = form.querySelector("[data-choice-answer]")
      ? root.querySelector("[data-choice-id][aria-pressed='true']")?.getAttribute("data-choice-id") || ""
      : "";
    if (isChoiceMission(mission) && !choiceId) {
      status.textContent = "Pick one answer first.";
      return;
    }
    if (mission.accepted) {
      const ok = mission.accepted.some((needle) => answer.toLowerCase().includes(needle));
      if (!ok) {
        status.textContent = "Not yet. Look again. The word is in front of you.";
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
      photoId = (await saveQuestPhoto(file)).id;
    }
    const participants = [...form.querySelectorAll('input[name="who"]:checked')].map(
      (input) => input.value
    );
    form.querySelector("[data-finish]").disabled = true;
    completeMission(quest, state, mission, {
      date: todayISO(TRIP.timezone),
      answer,
      choiceId,
      photoId,
      participants,
      completedBy: participants[0] || "",
      locationLabel: mission.location?.label || "",
      summary: mission.title,
    });
    const reveal = root.querySelector("[data-reveal-text]");
    if (reveal) reveal.textContent = mission.reveal;
    const reward = root.querySelector("[data-reward]");
    if (reward) reward.innerHTML = rewardHtml(quest, mission, labels);
    showPanel(root, "reveal");
  });
}
