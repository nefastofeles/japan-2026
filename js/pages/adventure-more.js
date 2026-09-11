/* ==========================================================================
   Quest Game — Codex finds and family badge seals
   ========================================================================== */

import { esc, todayISO } from "../util.js";
import { loadQuest, discoveryForCodex } from "../quest/content.js";
import { hydrateQuestState } from "../quest/sync.js";
import { isDiscovered, hasBadge } from "../quest/state.js";
import { currentChapter } from "../quest/engine.js";
import { TRIP } from "../config.js";
import { questShell, familyRail } from "../components/quest-chrome.js";
import { visualHtml } from "../quest/visual.js";
import { adventureMapPage } from "./adventure-journey.js";

function sealHtml(item) {
  const src = item.visual?.src;
  const alt = item.visual?.alt || item.name || item.title || "Family seal";
  if (!src) return "";
  return `<img class="quest-seal" src="${esc(src)}?v=41" alt="${esc(alt)}" width="96" height="96">`;
}

export { adventureMapPage };

export async function adventureCodexPage() {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const cats = [...new Set(quest.codex.map((entry) => entry.category))];
  const chapter = currentChapter(quest, todayISO(TRIP.timezone));
  const visibleBadges = quest.badges.filter(
    (badge) => !badge.hidden || hasBadge(state, badge.id)
  );
  const visibleRewards = (quest.rewards || []).filter((reward) => !reward.hidden);

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
                      ${visualHtml(entry, quest, { compact: true, complete: open })}
                      <div class="quest-entry__body">
                      <h3>${
                        open
                          ? esc(entry.name)
                          : findable?.findable
                            ? esc(entry.name)
                            : "???"
                      }</h3>
                      <p class="quest-pill">${esc(entry.category)}</p>
                      ${
                        open
                          ? `<p class="jp">${esc(entry.japaneseName || "")}</p>
                             <p class="quest-prose">${esc(entry.description)}</p>`
                          : findable?.findable
                            ? `<p class="quest-prose">${esc(findable.hook)}</p>
                               <a class="btn" href="#/adventure/discovery/${esc(findable.id)}">We found this</a>`
                            : `<p class="quest-prose">???</p>`
                      }
                      </div>
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
      <div class="quest-badge-grid">
      ${visibleBadges
        .map((badge) => {
          const open = hasBadge(state, badge.id);
          return `
            <article class="quest-badge ${open ? "" : "quest-badge--locked"}">
              ${sealHtml(badge)}
              <div>
              <h3>${open ? esc(badge.name) : "???"}</h3>
              <p class="quest-prose">${open ? esc(badge.description) : "Still waiting."}</p>
              ${
                open && badge.realWorldReward
                  ? `<p><strong>${esc(badge.realWorldReward)}</strong></p>`
                  : ""
              }
              </div>
            </article>`;
        })
        .join("")}
      </div>
    </section>

    <section class="stack quest-section">
      <h2 class="section-title">Family rewards</h2>
      <div class="quest-badge-grid">
      ${visibleRewards
        .map((reward) => `
            <article class="quest-badge${reward.hidden ? " quest-badge--locked" : ""}">
              ${sealHtml(reward)}
              <div>
              <h3>${esc(reward.title)}</h3>
              <p class="quest-prose">${esc(reward.description)}</p>
              </div>
            </article>`)
        .join("")}
      </div>
    </section>`
  , { rail: familyRail(quest, state, chapter), chapterId: chapter.id });
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
