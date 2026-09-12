/* ==========================================================================
   Quest Game — Journey library: chapter → module → published pages
   --------------------------------------------------------------------------
   The hub stays ranked for today. Journey is the complete adventure shelf,
   including future chapters the family can preview before departure.
   ========================================================================== */

import { esc, todayISO } from "../util.js";
import { TRIP } from "../config.js";
import {
  loadQuest, chapterById, missionsForChapter, missionsForModule,
  discoveriesForChapter, discoveriesForModule,
} from "../quest/content.js";
import { moduleById } from "../quest/modules.js";
import { hydrateQuestState } from "../quest/sync.js";
import { isComplete, isDiscovered } from "../quest/state.js";
import { currentChapter, chapterComplete, chapterFragments, isMemoryMode } from "../quest/engine.js";
import { questShell, typeMark, wireListen, listenBar, familyRail } from "../components/quest-chrome.js";
import { visualHtml } from "../quest/visual.js";

function tripToday() {
  return todayISO(TRIP.timezone);
}

export function chapterLabel(chapter, current, today, done) {
  const preview = today < TRIP.start || chapter.startDate > today;
  if (chapter.tone === "memory") {
    if (done) return "Kept";
    return preview || chapter.id !== current.id ? "PREVIEW · Memory" : "Memory";
  }
  if (chapter.id === "finale") {
    if (done) return "Complete";
    return preview || chapter.id !== current.id ? "PREVIEW · Final chapter" : "Final chapter";
  }
  if (done) return "Complete";
  if (chapter.id === current.id) return "Here";
  if (preview) return "PREVIEW";
  return "Open";
}

function hookLine(item) {
  const text = item.intro || item.task || item.hook || "";
  return text.split(/(?<=\.)\s/)[0] || text;
}

function missionCard(mission, state, quest, today, current) {
  const chapter = chapterById(quest, mission.chapterId) || current;
  const done = isComplete(state, mission.id);
  const memory = isMemoryMode(chapter, mission);
  const preview = today < TRIP.start || (chapter && chapter.startDate > today);
  const pill = memory
    ? done ? "Kept" : preview ? "PREVIEW" : "Memory"
    : done ? "Recovered" : preview ? "PREVIEW" : `${mission.xp || 0} XP`;
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

function discoveryCard(discovery, state, quest, today, chapter) {
  const found = isDiscovered(state, discovery.codexId || discovery.id);
  const preview = today < TRIP.start || (chapter && chapter.startDate > today);
  const pill = found ? "Found" : preview ? "PREVIEW" : `${discovery.xp || 0} XP`;
  return `
    <a class="quest-card quest-find quest-card--find" href="#/adventure/discovery/${esc(discovery.id)}">
      ${visualHtml(discovery, quest, { compact: true, complete: found })}
      <div class="quest-card__body">
        ${typeMark("discovery")}
        <h3>${esc(discovery.name || discovery.title)}</h3>
        <p class="quest-card__hook">${esc(hookLine(discovery))}</p>
        <span class="quest-pill">${esc(pill)}</span>
      </div>
    </a>`;
}

export async function adventureMapPage() {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const today = tripToday();
  const current = currentChapter(quest, today);
  const openStory = quest.story.filter((fragment) =>
    fragment.unlocksWith
      ? isDiscovered(state, fragment.unlocksWith)
      : isComplete(state, fragment.unlocksWithMission)
  );

  const html = questShell(
    "/adventure/map",
    `
    <p class="quest-prose">Every approved chapter is here. Today’s Quest screen stays short. Open a city to rehearse.</p>
    <ol class="quest-path">
      ${quest.chapters
        .map((chapter, index) => {
          const done = chapterComplete(quest, state, chapter.id);
          const here = chapter.id === current.id;
          const memory = chapter.tone === "memory";
          const bits = chapterFragments(quest, state, chapter.id);
          const label = chapterLabel(chapter, current, today, done);
          return `
            <li>
            <a class="quest-card quest-mission${here ? "" : " quest-card--preview"}"
               data-tone="${memory ? "memory" : ""}"
               href="#/adventure/map/${esc(chapter.id)}">
              ${visualHtml({ chapterId: chapter.id, type: memory ? "memory" : "story" }, quest, { compact: true })}
              <div class="quest-card__body">
              ${typeMark(memory ? "memory" : chapter.id === "finale" ? "story" : "story")}
              <p class="quest-kicker">${index + 1} · ${esc(chapter.destination)}</p>
              <h3>${esc(chapter.title)}</h3>
              <span class="quest-pill">${esc(label)}${
                bits.target ? ` · ${bits.earned}/${bits.target}` : ""
              }</span>
              </div>
            </a>
            </li>`;
        })
        .join("")}
    </ol>

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
    </section>`
  , { rail: familyRail(quest, state, current), chapterId: current.id, memory: current.tone === "memory" });

  const texts = {};
  openStory.forEach((fragment, index) => {
    texts[`story-${index}`] = fragment.body;
  });
  return {
    html,
    mount(root) {
      wireListen(root, texts);
    },
  };
}

export async function adventureChapterPage({ chapterId }) {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const today = tripToday();
  const current = currentChapter(quest, today);
  const chapter = chapterById(quest, chapterId);
  if (!chapter) {
    return questShell("/adventure/map", `<p class="empty">That chapter is missing.</p>`);
  }
  const packs = (quest.modules || []).filter((item) => item.chapterId === chapter.id);
  const looseMissions = missionsForChapter(quest, chapter.id).filter((mission) => !mission.moduleId);
  const looseFinds = discoveriesForChapter(quest, chapter.id).filter((item) => !item.moduleId);
  const done = chapterComplete(quest, state, chapter.id);
  const label = chapterLabel(chapter, current, today, done);
  const memory = chapter.tone === "memory";

  const html = questShell(
    "/adventure/map",
    `
    <p class="quest-kicker"><a href="#/adventure/map">Journey</a> · ${esc(chapter.destination)}</p>
    <h2>${esc(chapter.title)}</h2>
    <p class="quest-prose">${esc(chapter.theme || "")}</p>
    <p><span class="quest-pill">${esc(label)}</span></p>
    <div class="quest-hero__art">${visualHtml({ chapterId: chapter.id, type: memory ? "memory" : "story" }, quest)}</div>
    <section class="stack quest-section">
      <h2 class="section-title">Modules</h2>
      ${
        packs.length
          ? packs
              .map((pack) => {
                const count =
                  missionsForModule(quest, pack.id).length +
                  discoveriesForModule(quest, pack.id).length;
                return `
            <a class="quest-card" href="#/adventure/map/${esc(chapter.id)}/${esc(pack.id)}">
              ${visualHtml({ chapterId: chapter.id, moduleId: pack.id, type: "story" }, quest, { compact: true })}
              <div class="quest-card__body">
                <p class="quest-kicker">${pack.optional ? "Optional" : "Core"} · ${esc(pack.activation || "core")}</p>
                <h3>${esc(pack.title)}</h3>
                <span class="quest-pill">${count} published</span>
              </div>
            </a>`;
              })
              .join("")
          : `<p class="empty">No modules in this chapter.</p>`
      }
    </section>
    ${
      looseMissions.length || looseFinds.length
        ? `<section class="stack quest-section">
            <h2 class="section-title">Pages</h2>
            ${looseMissions.map((mission) => missionCard(mission, state, quest, today, current)).join("")}
            ${looseFinds.map((item) => discoveryCard(item, state, quest, today, chapter)).join("")}
          </section>`
        : ""
    }`
  , { rail: familyRail(quest, state, current), chapterId: chapter.id, memory });
  return { html };
}

export async function adventureModulePage({ chapterId, moduleId }) {
  const quest = await loadQuest();
  const state = await hydrateQuestState();
  const today = tripToday();
  const current = currentChapter(quest, today);
  const chapter = chapterById(quest, chapterId);
  const pack = moduleById(quest, moduleId);
  if (!chapter || !pack) {
    return questShell("/adventure/map", `<p class="empty">That module is missing.</p>`);
  }
  const missions = missionsForModule(quest, pack.id);
  const finds = discoveriesForModule(quest, pack.id);
  const preview = today < TRIP.start || chapter.startDate > today;
  const memory = chapter.tone === "memory";

  const html = questShell(
    "/adventure/map",
    `
    <p class="quest-kicker"><a href="#/adventure/map">Journey</a> ·
      <a href="#/adventure/map/${esc(chapter.id)}">${esc(chapter.destination)}</a></p>
    <h2>${esc(pack.title)}</h2>
    <p class="quest-prose">${esc(pack.subtitle || chapter.theme || "")}</p>
    <p><span class="quest-pill">${preview ? "PREVIEW" : pack.optional ? "Optional" : "Core"}</span></p>
    <section class="stack quest-section">
      <h2 class="section-title">Published pages</h2>
      ${
        missions.length || finds.length
          ? `${missions.map((mission) => missionCard(mission, state, quest, today, current)).join("")}
             ${finds.map((item) => discoveryCard(item, state, quest, today, chapter)).join("")}`
          : `<p class="empty">Nothing published in this module yet.</p>`
      }
    </section>`
  , { rail: familyRail(quest, state, current), chapterId: chapter.id, memory });
  return { html };
}
