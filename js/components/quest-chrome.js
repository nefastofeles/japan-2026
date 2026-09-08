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

const TABS = [
  ["/adventure", "Quest"],
  ["/adventure/codex", "Codex"],
  ["/adventure/map", "Journey"],
];

const TYPE_META = {
  find: { label: "Find", icon: "🔍" },
  photo: { label: "Photo", icon: "📷" },
  observe: { label: "Notice", icon: "👁" },
  solve: { label: "Solve", icon: "🧩" },
  food: { label: "Food", icon: "🍙" },
  story: { label: "Story", icon: "📖" },
  reflection: { label: "Sit with this", icon: "💭" },
  discovery: { label: "Discovery", icon: "✦" },
  memory: { label: "Memory", icon: "🕯️" },
};

export function typeMeta(type) {
  return TYPE_META[type] || { label: type, icon: "✦" };
}

export function typeLabel(type) {
  return typeMeta(type).label;
}

export function typeMark(type) {
  const meta = typeMeta(type);
  return `<span class="quest-type">
    <span class="quest-type__icon" aria-hidden="true">${meta.icon}</span>
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

export function questShell(activePath, body) {
  return `
    <div class="page stack quest-page">
      <header class="quest-head">
        <p class="quest-kicker">Quest</p>
        <h1>The Missing Stories of Japan</h1>
      </header>
      ${questTabs(activePath)}
      ${body}
    </div>`;
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
        <span aria-hidden="true">🔊</span> Listen
      </button>
      <button type="button" class="quest-listen__btn quest-listen__btn--ghost" data-listen-slow="${esc(textId)}">
        Slower
      </button>
      <button type="button" class="quest-listen__btn quest-listen__btn--ghost" data-listen-stop="${esc(textId)}" hidden>
        Stop
      </button>
    </div>`;
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
    main.innerHTML = `<span aria-hidden="true">🔊</span> Resume`;
  } else if (speaking) {
    main.innerHTML = `<span aria-hidden="true">🔊</span> Pause`;
  } else {
    main.innerHTML = `<span aria-hidden="true">🔊</span> Listen`;
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
