/* ==========================================================================
   Quest Game — journey (chapters + recovered story) and Codex (finds + badges)
   ========================================================================== */

import { esc, todayISO } from "../util.js";
import { loadQuest, discoveryForCodex } from "../quest/content.js";
import { hydrateQuestState } from "../quest/sync.js";
import { isComplete, isDiscovered, hasBadge } from "../quest/state.js";
import { currentChapter, chapterComplete, chapterFragments } from "../quest/engine.js";
import { TRIP } from "../config.js";
import { questShell, typeMark, wireListen, listenBar, familyRail } from "../components/quest-chrome.js";
import { modulesForChapter, activateModule, moduleEligible } from "../quest/modules.js";

export async function adventureMapPage() {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const today = todayISO(TRIP.timezone);
  const current = currentChapter(quest, today);
  const openStory = quest.story.filter((fragment) =>
    fragment.unlocksWith
      ? isDiscovered(state, fragment.unlocksWith)
      : isComplete(state, fragment.unlocksWithMission)
  );

  const html = questShell(
    "/adventure/map",
    `
    <p class="quest-prose">Chapters follow the trip. The Japan map is still under Map in the main menu.</p>
    <ol class="stack" style="list-style:none;padding:0">
      ${quest.chapters
        .map((chapter, index) => {
          const done = chapterComplete(quest, state, chapter.id);
          const here = chapter.id === current.id;
          const memory = chapter.tone === "memory";
          const bits = chapterFragments(quest, state, chapter.id);
          const packs = modulesForChapter(quest, chapter.id);
          return `
            <li class="quest-mission" data-tone="${memory ? "memory" : ""}">
              ${typeMark(memory ? "memory" : "story")}
              <p class="quest-kicker">${index + 1} · ${esc(chapter.destination)}</p>
              <h3>${esc(chapter.title)}</h3>
              ${
                packs.length
                  ? `<p class="quest-prose">${packs.map((pack) => esc(pack.title)).join(" · ")}</p>`
                  : ""
              }
              <span class="quest-pill">${
                done
                  ? memory
                    ? "Kept"
                    : "Complete"
                  : bits.target
                    ? `${bits.earned}/${bits.target} fragments`
                    : here
                      ? "Here"
                      : "Waiting"
              }</span>
            </li>`;
        })
        .join("")}
    </ol>

    <section class="stack quest-section">
      <h2 class="section-title">Modules here</h2>
      <p class="quest-prose">No required order. Optional areas can wait.</p>
      ${modulesForChapter(quest, current.id)
        .map((pack) => {
          const on = moduleEligible(pack, state, { date: today });
          return `
            <article class="quest-entry">
              <p class="quest-kicker">${pack.optional ? "Optional" : "Core"} · ${esc(pack.activation || "core")}</p>
              <h3>${esc(pack.title)}</h3>
              ${pack.subtitle ? `<p class="quest-prose">${esc(pack.subtitle)}</p>` : ""}
              ${
                pack.optional && !on
                  ? `<button class="btn" type="button" data-activate-module="${esc(pack.id)}">Open this module</button>`
                  : `<p class="quest-pill">${on ? "Open" : ""}</p>`
              }
            </article>`;
        })
        .join("")}
    </section>

    <section class="stack quest-section">
      <h2 class="section-title">Recovered chronicle</h2>
      ${
        openStory.length
          ? openStory
              .map(
                (fragment, index) => `
            <article class="quest-fragment">
              ${listenBar(`story-${index}`)}
              <h3>${esc(fragment.title)}</h3>
              <p>${esc(fragment.body)}</p>
            </article>`
              )
              .join("")
          : `<p class="empty">Finish a page out in the world. The story returns here.</p>`
      }
    </section>

    ${
      state.memories.length
        ? `<section class="stack quest-section">
            <h2 class="section-title">Family notes</h2>
            ${state.memories
              .map(
                (memory) => `
              <article class="card">
                <p>${esc(memory.date)}${memory.location ? ` · ${esc(memory.location)}` : ""}</p>
                <p><strong>${esc(memory.summary)}</strong></p>
                ${memory.answer ? `<p>${esc(memory.answer)}</p>` : ""}
              </article>`
              )
              .join("")}
          </section>`
        : ""
    }`
  , { rail: familyRail(quest, state, current) });

  const texts = {};
  openStory.forEach((fragment, index) => {
    texts[`story-${index}`] = fragment.body;
  });
  return {
    html,
    mount(root) {
      wireListen(root, texts);
      root.querySelectorAll("[data-activate-module]").forEach((button) => {
        button.addEventListener("click", () => {
          activateModule(state, button.getAttribute("data-activate-module"));
          const note = document.createElement("p");
          note.className = "quest-pill";
          note.textContent = "Open";
          button.replaceWith(note);
        });
      });
    },
  };
}

export async function adventureCodexPage() {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const cats = [...new Set(quest.codex.map((entry) => entry.category))];
  const chapter = currentChapter(quest, todayISO(TRIP.timezone));
  const visibleBadges = quest.badges.filter(
    (badge) => !badge.hidden || hasBadge(state, badge.id)
  );

  const html = questShell(
    "/adventure/codex",
    `
    <p class="quest-prose">${state.discovered.length} of ${quest.codex.length} recovered.</p>
    ${cats
      .map((category) => {
        const items = quest.codex.filter((entry) => entry.category === category);
        const found = items.filter((entry) => isDiscovered(state, entry.id)).length;
        return `
          <section class="stack quest-section">
            <h2 class="section-title">${esc(category)}
              <span class="muted"> ${found}/${items.length}</span></h2>
            <div class="quest-codex">
              ${items
                .map((entry) => {
                  const open = isDiscovered(state, entry.id);
                  const findable = discoveryForCodex(quest, entry.id);
                  return `
                    <article class="quest-entry ${open ? "" : "quest-entry--locked"}">
                      ${typeMark(open ? "discovery" : "discovery")}
                      <h3>${
                        open
                          ? esc(entry.name)
                          : findable?.findable
                            ? esc(entry.name)
                            : "Not yet"
                      }</h3>
                      ${
                        open
                          ? `<p class="jp">${esc(entry.japaneseName || "")}</p>
                             <p class="quest-prose">${esc(entry.description)}</p>`
                          : findable?.findable
                            ? `<p class="quest-prose">${esc(findable.hook)}</p>
                               <a class="btn" href="#/adventure/discovery/${esc(findable.id)}">We found this</a>`
                            : `<p class="quest-prose">A mission will open this.</p>`
                      }
                    </article>`;
                })
                .join("")}
            </div>
          </section>`;
        })
      .join("")}

    <section class="stack quest-section">
      <h2 class="section-title">Family badges</h2>
      <p class="quest-prose">One family. No scores against each other.</p>
      ${visibleBadges
        .map((badge) => {
          const open = hasBadge(state, badge.id);
          return `
            <article class="quest-badge ${open ? "" : "quest-badge--locked"}">
              <h3>${esc(badge.name)}</h3>
              <p class="quest-prose">${open ? esc(badge.description) : "Still waiting."}</p>
              ${
                open && badge.realWorldReward
                  ? `<p><strong>${esc(badge.realWorldReward)}</strong></p>`
                  : ""
              }
            </article>`;
        })
        .join("")}
    </section>`
  , { rail: familyRail(quest, state, chapter) });
  return { html };
}

export async function adventureBadgesPage() {
  history.replaceState(null, "", "#/adventure/codex");
  return adventureCodexPage();
}

export async function adventureStoryPage() {
  history.replaceState(null, "", "#/adventure/map");
  return adventureMapPage();
}
