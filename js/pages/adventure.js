/* ==========================================================================
   Quest Game — home
   --------------------------------------------------------------------------
   Current chapter, today's missions, family XP. Sends people back outside.
   ========================================================================== */

import { getPeople, getLeg } from "../store.js";
import { esc, todayISO, formatDate } from "../util.js";
import { TRIP } from "../config.js";
import { loadQuest, missionsForChapter } from "../quest/content.js";
import { loadState, isComplete } from "../quest/state.js";
import {
  currentChapter, nextChapter, familyXp, tripProgress, todaysMissions,
  chapterComplete, missionStatus,
} from "../quest/engine.js";
import { questShell, typeLabel } from "../components/quest-chrome.js";

function missionCard(mission, state, chapter) {
  const done = isComplete(state, mission.id);
  const tone = chapter.tone === "memory" || mission.sensitive ? "memory" : "";
  return `
    <a class="quest-mission" data-tone="${esc(tone)}"
       href="#/adventure/mission/${esc(mission.id)}">
      <span class="quest-mission__type">${esc(typeLabel(mission.type))}
        ${mission.anchorEvent ? " · booked day" : ""}</span>
      <h3>${esc(mission.title)}</h3>
      <p class="muted">${esc(mission.intro)}</p>
      <span class="quest-pill">${done ? "Recovered" : `${mission.xp || 0} XP`}</span>
    </a>`;
}

export async function adventurePage() {
  const quest = await loadQuest();
  const state = loadState();
  const today = todayISO(TRIP.timezone);
  const chapter = currentChapter(quest, today);
  const following = nextChapter(quest, chapter);
  const progress = tripProgress(quest, state);
  const open = todaysMissions(quest, state, chapter, today).filter((mission) => {
    const status = missionStatus(mission, state, { date: today });
    return status === "open" || status === "nearby" || status === "scheduled";
  });
  const done = missionsForChapter(quest, chapter.id).filter((mission) =>
    isComplete(state, mission.id)
  );
  const people = getPeople();
  const leg = getLeg(chapter.leg);
  const continueHref = open[0]
    ? `#/adventure/mission/${open[0].id}`
    : "#/adventure/story";

  const html = questShell(
    "/adventure",
    `
    <section class="quest-hero" data-leg="${esc(chapter.leg)}">
      <p class="quest-kicker">${esc(leg.name)} · ${esc(formatDate(chapter.startDate, { weekday: false }))}</p>
      <h2>${esc(chapter.title)}</h2>
      <p>${esc(chapter.theme)}</p>
      <p class="muted">${esc(chapter.destination)}</p>
      <a class="quest-cta" href="${esc(continueHref)}">
        ${open.length ? "Continue the chronicle" : "Read what you recovered"}
      </a>
    </section>

    <div class="quest-stats">
      <div class="quest-stat">
        <strong>${familyXp(state)}</strong>
        Family XP
      </div>
      <div class="quest-stat">
        <strong>${progress.done}/${progress.total}</strong>
        Pages recovered
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

    <section class="stack">
      <h2 class="section-title">Out in the world</h2>
      <p class="muted">Read for a minute. Then look up. Come back to finish.</p>
      ${
        open.length
          ? open.map((mission) => missionCard(mission, state, chapter)).join("")
          : `<p class="empty">${
              chapterComplete(quest, state, chapter.id)
                ? "This chapter’s pages are in. Walk around anyway."
                : "Nothing queued. Open a locked mission from Journey when you are there."
            }</p>`
      }
    </section>

    ${
      done.length
        ? `<section class="stack">
            <h2 class="section-title">Recovered here</h2>
            ${done.map((mission) => missionCard(mission, state, chapter)).join("")}
          </section>`
        : ""
    }

    ${
      following
        ? `<p class="muted">Next chapter: ${esc(following.title)} · ${esc(following.destination)}</p>`
        : ""
    }

    <p class="small muted">Players: ${people
      .filter((person) => person.id !== "javier")
      .map((person) => esc(person.name))
      .join(", ")}. Javier holds the map.</p>
    `
  );

  return { html };
}
