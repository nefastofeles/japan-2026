/* ==========================================================================
   Quest Game — a lightweight discovery
   --------------------------------------------------------------------------
   Not a full mission. Short find, short XP, then Codex.
   ========================================================================== */

import { getPeople } from "../store.js";
import { todayISO } from "../util.js";
import { TRIP } from "../config.js";
import { loadQuest, discoveryById, chapterById, codexById } from "../quest/content.js";
import { hydrateQuestState } from "../quest/sync.js";
import { loadState, isDiscovered } from "../quest/state.js";
import { collectDiscovery } from "../quest/engine.js";
import { questShell, wireListen } from "../components/quest-chrome.js";
import { renderDiscoveryPage, discoverySpeech } from "../quest/mission-screen.js";

export async function adventureDiscoveryPage({ id }) {
  const quest = await loadQuest();
  await hydrateQuestState();
  const discovery = discoveryById(quest, id);
  if (!discovery) {
    return questShell("/adventure/codex", `<p class="empty">That find is missing.</p>`);
  }
  const chapter = chapterById(quest, discovery.chapterId);
  const entry = codexById(quest, discovery.codexId || discovery.id);
  const state = loadState();
  const found = isDiscovered(state, discovery.codexId || discovery.id);
  const people = getPeople();

  return {
    html: renderDiscoveryPage({ quest, discovery, chapter, entry, people, found }),
    mount(root) {
      const texts = discoverySpeech(discovery, entry);
      wireListen(root, texts);
      root.querySelector("[data-to-task]")?.addEventListener("click", () => {
        root.querySelectorAll("[data-panel]").forEach((panel) => {
          panel.classList.toggle("is-on", panel.dataset.panel === "task");
        });
      });
      root.querySelector("[data-show-hint]")?.addEventListener("click", (event) => {
        const hint = root.querySelector("[data-hint]");
        if (hint) hint.hidden = false;
        event.currentTarget.hidden = true;
      });
      const form = root.querySelector("[data-quest-form]");
      if (!form) return;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const participants = [...form.querySelectorAll('input[name="who"]:checked')].map(
          (input) => input.value
        );
        collectDiscovery(quest, state, discovery, {
          date: todayISO(TRIP.timezone),
          participants,
        });
        const reveal = root.querySelector("[data-reveal-text]");
        if (reveal) reveal.textContent = discovery.reveal || entry?.description || "";
        root.querySelectorAll("[data-panel]").forEach((panel) => {
          panel.classList.toggle("is-on", panel.dataset.panel === "reveal");
        });
      });
    },
  };
}
