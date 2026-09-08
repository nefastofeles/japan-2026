/* ==========================================================================
   Quest Game — journey, codex, badges, recovered story
   ========================================================================== */

import { esc } from "../util.js";
import { loadQuest } from "../quest/content.js";
import { loadState, isComplete, isDiscovered, hasBadge } from "../quest/state.js";
import { currentChapter, chapterComplete } from "../quest/engine.js";
import { TRIP } from "../config.js";
import { todayISO } from "../util.js";
import { questShell } from "../components/quest-chrome.js";

export async function adventureMapPage() {
  const quest = await loadQuest();
  const state = loadState();
  const today = todayISO(TRIP.timezone);
  const current = currentChapter(quest, today);

  const html = questShell(
    "/adventure/map",
    `
    <p class="muted">Chapters follow the itinerary. The illustrated Japan map is still under Map in the main menu.</p>
    <ol class="stack" style="list-style:none;padding:0">
      ${quest.chapters
        .map((chapter, index) => {
          const done = chapterComplete(quest, state, chapter.id);
          const here = chapter.id === current.id;
          return `
            <li class="quest-mission" data-tone="${esc(chapter.tone)}">
              <span class="quest-mission__type">${index + 1} · ${esc(chapter.destination)}</span>
              <h3>${esc(chapter.title)}</h3>
              <p>${esc(chapter.theme)}</p>
              <span class="quest-pill">${
                done ? "Complete" : here ? "You are here" : "Waiting"
              }</span>
            </li>`;
        })
        .join("")}
    </ol>`
  );
  return { html };
}

export async function adventureCodexPage() {
  const quest = await loadQuest();
  const state = loadState();
  const cats = [...new Set(quest.codex.map((entry) => entry.category))];

  const html = questShell(
    "/adventure/codex",
    `
    <p>${state.discovered.length} of ${quest.codex.length} recovered.</p>
    ${cats
      .map((category) => {
        const items = quest.codex.filter((entry) => entry.category === category);
        const found = items.filter((entry) => isDiscovered(state, entry.id)).length;
        return `
          <section class="stack">
            <h2 class="section-title">${esc(category)}
              <span class="muted"> ${found}/${items.length}</span></h2>
            <div class="quest-codex">
              ${items
                .map((entry) => {
                  const open = isDiscovered(state, entry.id);
                  return `
                    <article class="quest-entry ${open ? "" : "quest-entry--locked"}">
                      <p class="quest-mission__type">${esc(category)}</p>
                      <h3>${open ? esc(entry.name) : "????"}</h3>
                      ${
                        open
                          ? `<p class="jp">${esc(entry.japaneseName || "")}</p>
                             <p>${esc(entry.description)}</p>`
                          : `<p>Not yet.</p>`
                      }
                    </article>`;
                })
                .join("")}
            </div>
          </section>`;
      })
      .join("")}`
  );
  return { html };
}

export async function adventureBadgesPage() {
  const quest = await loadQuest();
  const state = loadState();
  const visible = quest.badges.filter(
    (badge) => !badge.hidden || hasBadge(state, badge.id)
  );

  const html = questShell(
    "/adventure/badges",
    `
    <p class="muted">One family. No scores against each other.</p>
    <div class="stack">
      ${visible
        .map((badge) => {
          const open = hasBadge(state, badge.id);
          return `
            <article class="quest-badge ${open ? "" : "quest-badge--locked"}">
              <h3>${esc(badge.name)}</h3>
              <p>${open ? esc(badge.description) : "Still in the dark."}</p>
              ${
                open && badge.realWorldReward
                  ? `<p><strong>${esc(badge.realWorldReward)}</strong></p>`
                  : ""
              }
            </article>`;
        })
        .join("")}
    </div>`
  );
  return { html };
}

export async function adventureStoryPage() {
  const quest = await loadQuest();
  const state = loadState();

  const html = questShell(
    "/adventure/story",
    `
    <p class="muted">Pages return when you finish missions. Nothing here is a feed. Read, then go back outside.</p>
    ${quest.story
      .map((fragment) => {
        const open = fragment.unlocksWith
          ? isDiscovered(state, fragment.unlocksWith)
          : isComplete(state, fragment.unlocksWithMission);
        return `
          <article class="quest-fragment ${open ? "" : "quest-fragment--locked"}">
            <h3>${open ? esc(fragment.title) : "Locked fragment"}</h3>
            <p>${open ? esc(fragment.body) : "Recover a page in the world first."}</p>
          </article>`;
      })
      .join("")}
    ${
      state.memories.length
        ? `<section class="stack">
            <h2 class="section-title">Family notes</h2>
            ${state.memories
              .map(
                (memory) => `
              <article class="card">
                <p class="small">${esc(memory.date)} · ${esc(memory.location)}</p>
                <p><strong>${esc(memory.summary)}</strong></p>
                ${memory.answer ? `<p>${esc(memory.answer)}</p>` : ""}
              </article>`
              )
              .join("")}
          </section>`
        : ""
    }`
  );
  return { html };
}
