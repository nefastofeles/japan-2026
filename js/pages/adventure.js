/* ==========================================================================
   Quest Game — home
   --------------------------------------------------------------------------
   Current chapter, today's missions, nearby discoveries, family XP.
   ========================================================================== */

import { getPeople, getLeg } from "../store.js";
import { esc, todayISO, formatDate } from "../util.js";
import { TRIP } from "../config.js";
import { loadQuest, missionsForChapter } from "../quest/content.js";
import { hydrateQuestState } from "../quest/sync.js";
import { isComplete } from "../quest/state.js";
import {
  currentChapter, nextChapter, todaysMissions,
  chapterComplete, openDiscoveries, isMemoryMode,
} from "../quest/engine.js";
import { questShell, typeMark, familyRail } from "../components/quest-chrome.js";
import { typeIcon } from "../components/quest-icons.js";
import { visualHtml } from "../quest/visual.js";

function hookLine(mission) {
  const text = mission.intro || mission.task || "";
  const cut = text.split(/(?<=\.)\s/)[0] || text;
  return cut;
}

function missionCard(mission, state, chapter, quest) {
  const done = isComplete(state, mission.id);
  const memory = isMemoryMode(chapter, mission);
  const pill = memory
    ? done
      ? "Kept"
      : "Memory"
    : done
      ? "Recovered"
      : `${mission.xp || 0} XP`;
  return `
    <a class="quest-card quest-mission" data-tone="${memory ? "memory" : ""}"
       href="#/adventure/mission/${esc(mission.id)}">
      ${visualHtml(mission, quest, { compact: true, complete: done })}
      <div class="quest-card__body">
        ${typeMark(memory ? "memory" : mission.type)}
        <h3>${esc(mission.title)}</h3>
        <p class="quest-card__hook">${esc(hookLine(mission))}</p>
        <span class="quest-pill">${esc(pill)}</span>
      </div>
    </a>`;
}

function discoveryCard(discovery, quest) {
  return `
    <a class="quest-card quest-find quest-card--find" href="#/adventure/discovery/${esc(discovery.id)}">
      ${visualHtml(discovery, quest, { compact: true })}
      <div class="quest-card__body">
        ${typeIcon("discovery")}
        ${typeMark("discovery")}
        <h3>${esc(discovery.name)}</h3>
        <span class="quest-pill">${discovery.xp || 0} XP</span>
      </div>
    </a>`;
}

export async function adventurePage() {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const today = todayISO(TRIP.timezone);
  const chapter = currentChapter(quest, today);
  const following = nextChapter(quest, chapter);
  const open = todaysMissions(quest, state, chapter, today);
  const finds = openDiscoveries(quest, state, chapter);
  const done = missionsForChapter(quest, chapter.id).filter((mission) =>
    isComplete(state, mission.id)
  );
  const people = getPeople();
  const leg = getLeg(chapter.leg);
  const continueHref = open[0]
    ? `#/adventure/mission/${open[0].id}`
    : "#/adventure/map";
  const memoryChapter = chapter.tone === "memory";

  const html = questShell(
    "/adventure",
    `
    <section class="quest-hero" data-leg="${esc(chapter.leg)}" data-tone="${memoryChapter ? "memory" : ""}">
      <p class="quest-brand">Japan Quest</p>
      <h2>${esc(chapter.title)}</h2>
      <p class="quest-card__hook">${esc(chapter.theme)}</p>
      <div class="quest-hero__art" aria-hidden="false">
        ${visualHtml({ chapterId: chapter.id, type: memoryChapter ? "memory" : "story" }, quest)}
      </div>
      <a class="quest-cta" href="${esc(continueHref)}">
        ${open.length ? "Continue adventure" : "See the journey"}
      </a>
    </section>

    <section class="stack quest-section">
      <h2 class="section-title">${memoryChapter ? "Memories here" : "Out in the world"}</h2>
      ${
        open.length
          ? open.map((mission) => missionCard(mission, state, chapter, quest)).join("")
          : `<p class="empty">${
              chapterComplete(quest, state, chapter.id)
                ? "This chapter’s pages are in."
                : "Nothing queued. Open Journey when you arrive."
            }</p>`
      }
    </section>

    ${
      finds.length
        ? `<section class="stack quest-section">
            <h2 class="section-title">Nearby finds</h2>
            ${finds.map((find) => discoveryCard(find, quest)).join("")}
          </section>`
        : ""
    }

    ${
      done.length
        ? `<section class="stack quest-section">
            <h2 class="section-title">${memoryChapter ? "Already kept" : "Recovered here"}</h2>
            ${done.map((mission) => missionCard(mission, state, chapter, quest)).join("")}
          </section>`
        : ""
    }

    ${
      following
        ? `<p class="quest-prose">Next: ${esc(following.title)}.</p>`
        : ""
    }

    <p class="quest-prose">Players: ${people
      .filter((person) => person.id !== "javier")
      .map((person) => esc(person.name))
      .join(", ")}.</p>
    `
  , {
    hideHead: true,
    memory: memoryChapter,
    chapterId: chapter.id,
    rail: familyRail(quest, state, chapter),
  });

  return { html };
}
