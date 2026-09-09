/**
 * Shared Quest chrome: three inner tabs, type labels, Listen.
 *
 * Badges live in Codex. Recovered story lives in Journey.
 * The site’s main nav is already crowded; keep this strip short.
 */

import { esc } from "../util.js";
import {
  speechAvailable, speakNormal, speakSlow, stopSpeech,
  pauseSpeech, resumeSpeech, isSpeaking, isSpeechPaused,
} from "../quest/speech.js";
import { familyXp } from "../quest/engine.js";
import { chapterFragments, nextVisibleReward } from "../quest/progress.js";
import { questIcon, typeIcon } from "./quest-icons.js";

const TABS = [
  ["/adventure", "Quest"],
  ["/adventure/codex", "Codex"],
  ["/adventure/map", "Journey"],
];

const TYPE_META = {
  find: { label: "Find" },
  photo: { label: "Photo" },
  observe: { label: "Notice" },
  observation: { label: "Notice" },
  solve: { label: "Solve" },
  riddle: { label: "Riddle" },
  multipleChoice: { label: "Choose" },
  trueFalse: { label: "True or false" },
  food: { label: "Food" },
  story: { label: "Story" },
  reflection: { label: "Sit with this" },
  discovery: { label: "Discovery" },
  memory: { label: "Memory" },
};

export function typeMeta(type) {
  return TYPE_META[type] || { label: type };
}

export function typeLabel(type) {
  return typeMeta(type).label;
}

export function typeMark(type) {
  const meta = typeMeta(type);
  return `<span class="quest-type">
    ${typeIcon(type)}
    <span>${esc(meta.label)}</span>
  </span>`;
}

export function questTabs(activePath) {
  return `
    <nav class="quest-tabs" aria-label="Quest">
      ${TABS.map(([href, label]) => {
        const on =
          href === "/adventure"
            ? activePath === "/adventure" || activePath.startsWith("/adventure/mission")
              || activePath.startsWith("/adventure/discovery")
            : activePath.startsWith(href);
        return `<a href="#${href}" ${on ? 'aria-current="page"' : ""}>${esc(label)}</a>`;
      }).join("")}
    </nav>`;
}

export function questShell(activePath, body, options = {}) {
  const memory = options.memory ? " quest-page--memory" : "";
  const compact = options.compact ? " quest-page--compact" : "";
  const chapterId = options.chapterId || "";
  return `
    <div class="page stack quest-page${compact}${memory}" data-chapter="${esc(chapterId)}">
      ${
        options.hideHead
          ? ""
          : `<header class="quest-head">
        <p class="quest-brand">Japan Quest</p>
        ${options.compact ? "" : `<h1>The Missing Stories of Japan</h1>`}
      </header>`
      }
      ${questTabs(activePath)}
      ${options.rail || ""}
      ${body}
    </div>`;
}

export function familyRail(quest, state, chapter) {
  if (!chapter || !state || !quest) return "";
  const xp = familyXp(quest, state);
  return progressRail({
    chapter,
    fragments: chapterFragments(quest, state, chapter.id),
    xp,
    next: nextVisibleReward(quest, state, xp),
    memory: chapter.tone === "memory",
  });
}

export function progressRail({ chapter, fragments, xp, next, memory }) {
  if (memory || !chapter) return "";
  const pct = fragments?.pct || 0;
  const nextLine = next
    ? next.xpThreshold
      ? `${next.xpThreshold} XP → ${next.title}`
      : next.title
    : "Nothing queued";
  return `
    <section class="quest-rail" aria-label="Family progress">
      <div class="quest-rail__top">
        <span class="quest-rail__seal">${questIcon("badge")}</span>
        <p class="quest-rail__kicker">Current chapter<br>${esc(chapter.destination)}</p>
      </div>
      <div class="quest-rail__bar" role="progressbar"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
        <span style="width:${pct}%"></span>
      </div>
      <p class="quest-rail__meta">
        <span class="quest-reward">${questIcon("xp")} Family XP ${xp}</span>
        <span class="quest-reward">${questIcon("fragment")} ${fragments?.earned || 0}/${fragments?.target || 0}</span>
      </p>
      <p class="quest-rail__next">${questIcon("badge")} Next reward · ${esc(nextLine)}</p>
    </section>`;
}

export function peopleChecks(people, prefix = "who") {
  return people
    .map(
      (person) => `
      <label class="quest-who">
        <input type="checkbox" name="${esc(prefix)}" value="${esc(person.id)}"
               ${person.id === "javier" ? "" : "checked"}>
        <span>${esc(person.name)}</span>
      </label>`
    )
    .join("");
}

export function listenBar(textId) {
  if (!speechAvailable()) {
    return `<p class="quest-listen-fallback">Voice is not on this phone. Read the short lines instead.</p>`;
  }
  return `
    <div class="quest-listen" data-listen-root="${esc(textId)}">
      <button type="button" class="quest-listen__btn" data-listen="${esc(textId)}">
        ${questIcon("listen")} Listen
      </button>
      <button type="button" class="quest-listen__btn quest-listen__btn--ghost" data-listen-slow="${esc(textId)}">
        Slower
      </button>
      <button type="button" class="quest-listen__btn quest-listen__btn--ghost" data-listen-stop="${esc(textId)}" hidden>
        Stop
      </button>
    </div>`;
}

function listenLabel(kind) {
  if (kind === "resume") return `${questIcon("listen")} Resume`;
  if (kind === "pause") return `${questIcon("listen")} Pause`;
  return `${questIcon("listen")} Listen`;
}

function refreshListen(root, textId) {
  const bar = root.querySelector(`[data-listen-root="${textId}"]`);
  if (!bar) return;
  const main = bar.querySelector("[data-listen]");
  const stop = bar.querySelector("[data-listen-stop]");
  const speaking = isSpeaking();
  if (stop) stop.hidden = !speaking;
  if (!main) return;
  if (speaking && isSpeechPaused()) {
    main.innerHTML = listenLabel("resume");
  } else if (speaking) {
    main.innerHTML = listenLabel("pause");
  } else {
    main.innerHTML = listenLabel("listen");
  }
}

export function wireListen(root, texts) {
  if (!speechAvailable()) return;

  const read = (id) => texts[id] || "";

  root.querySelectorAll("[data-listen]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-listen");
      if (isSpeaking() && !isSpeechPaused()) {
        if (!pauseSpeech()) stopSpeech();
      } else if (isSpeechPaused()) {
        resumeSpeech();
      } else {
        speakNormal(read(id));
      }
      window.setTimeout(() => refreshListen(root, id), 80);
    });
  });

  root.querySelectorAll("[data-listen-slow]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-listen-slow");
      speakSlow(read(id));
      window.setTimeout(() => refreshListen(root, id), 80);
    });
  });

  root.querySelectorAll("[data-listen-stop]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-listen-stop");
      stopSpeech();
      refreshListen(root, id);
    });
  });
}

export function memoryLabels({ index, total }) {
  return {
    kicker: total ? `Memory ${index} of ${total}` : "Memory",
    yourMission: "What to do",
    revealTitle: "Kept",
    doneTitle: "Kept",
    finish: "Keep this memory",
    continueLabel: "Continue",
    showXp: false,
    showBadge: false,
  };
}

export function playLabels(type) {
  return {
    kicker: typeLabel(type),
    yourMission: "Your mission",
    revealTitle: "Discovery",
    doneTitle: "Recovered",
    finish: "We did this",
    continueLabel: "Continue",
    showXp: true,
    showBadge: true,
  };
}
