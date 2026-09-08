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
  currentChapter, nextChapter, familyXp, tripProgress, todaysMissions,
  chapterComplete, missionStatus, openDiscoveries, isMemoryMode,
} from "../quest/engine.js";
import { questShell, typeMark } from "../components/quest-chrome.js";

function missionCard(mission, state, chapter) {
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
    <a class="quest-mission" data-tone="${memory ? "memory" : ""}"
       href="#/adventure/mission/${esc(mission.id)}">
      ${typeMark(memory ? "memory" : mission.type)}
      <h3>${esc(mission.title)}</h3>
      <span class="quest-pill">${esc(pill)}</span>
    </a>`;
}

function discoveryCard(discovery) {
  return `
    <a class="quest-find" href="#/adventure/discovery/${esc(discovery.id)}">
      ${typeMark("discovery")}
      <h3>${esc(discovery.name)}</h3>
      <span class="quest-pill">${discovery.xp || 0} XP</span>
    </a>`;
}

export async function adventurePage() {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const today = todayISO(TRIP.timezone);
  const chapter = currentChapter(quest, today);
  const following = nextChapter(quest, chapter);
  const progress = tripProgress(quest, state);
  const open = todaysMissions(quest, state, chapter, today).filter((mission) => {
    const status = missionStatus(mission, state, { date: today });
    return status === "open" || status === "nearby" || status === "scheduled";
  });
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
      <p class="quest-kicker">${esc(leg.name)} · ${esc(formatDate(chapter.startDate, { weekday: false }))}</p>
      <h2>${esc(chapter.title)}</h2>
      <div class="quest-prose"><p>${esc(chapter.theme)}</p></div>
      <a class="quest-cta" href="${esc(continueHref)}">
        ${open.length ? "Continue" : "See the journey"}
      </a>
    </section>

    <div class="quest-stats">
      <div class="quest-stat">
        <strong>${familyXp(quest, state)}</strong>
        Family XP
      </div>
      <div class="quest-stat">
        <strong>${progress.done}/${progress.total}</strong>
        Pages
      </div>
      <div class="quest-stat">
        <strong>${state.discovered.length}</strong>
        Codex
      </div>
      <div class="quest-stat">
        <strong>${state.badges.length}</strong>
        Badges
      </div>
    </div>

    <section class="stack quest-section">
      <h2 class="section-title">${memoryChapter ? "Memories here" : "Out in the world"}</h2>
      ${
        open.length
          ? open.map((mission) => missionCard(mission, state, chapter)).join("")
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
            <p class="quest-prose">Small things. Not full missions.</p>
            ${finds.map(discoveryCard).join("")}
          </section>`
        : ""
    }

    ${
      done.length
        ? `<section class="stack quest-section">
            <h2 class="section-title">${memoryChapter ? "Already kept" : "Recovered here"}</h2>
            ${done.map((mission) => missionCard(mission, state, chapter)).join("")}
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
  );

  return { html };
}
