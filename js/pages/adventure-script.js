/* ==========================================================================
   Adventure Script — read-only editorial view
   --------------------------------------------------------------------------
   We edit JSON in git. This page only shows what is written, grouped by
   chapter then module. Live items point at missions; they are not a second
   copy of the game.
   ========================================================================== */

import { esc } from "../util.js";
import { loadQuest, chapterById } from "../quest/content.js";
import { moduleById } from "../quest/modules.js";
import { questShell } from "../components/quest-chrome.js";

const STATUS_LABEL = {
  idea: "Idea",
  draft: "Draft",
  reviewed: "Reviewed",
  approved: "Approved",
  live: "Live",
};

function asText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.text || value.title || "";
  return String(value);
}

function itemFields(item) {
  const rows = [
    ["Where", item.locationDescription],
    ["Exact spot", item.exactLocation],
    ["Question", asText(item.question)],
    ["Riddle", item.riddle],
    ["Story", item.story],
    ["History", item.historicalTheme],
    ["Mythology", item.mythologyTheme],
    ["Weird fact", item.weirdFact],
    ["Look at", item.physicalObservation],
    ["Visual idea", item.visualIdea],
    ["Reward idea", item.rewardIdea],
    ["Notes", item.notes],
    ["Live mission", item.liveMissionId],
  ].filter(([, value]) => value);
  if (!rows.length) return `<p class="quest-prose">No extra notes yet.</p>`;
  return rows
    .map(
      ([label, value]) =>
        `<p class="quest-prose"><strong>${esc(label)}.</strong> ${esc(value)}</p>`
    )
    .join("");
}

export async function adventureScriptPage() {
  const quest = await loadQuest();
  const packs = quest.script || [];

  const byChapter = new Map();
  for (const pack of packs) {
    const chapterId = pack.chapterId || "unknown";
    if (!byChapter.has(chapterId)) byChapter.set(chapterId, []);
    byChapter.get(chapterId).push(pack);
  }
  const chapterOrder = (quest.chapters || []).map((chapter) => chapter.id);
  const grouped = [...byChapter.entries()].sort((a, b) => {
    const left = chapterOrder.indexOf(a[0]);
    const right = chapterOrder.indexOf(b[0]);
    return (left < 0 ? 99 : left) - (right < 0 ? 99 : right);
  });

  const html = questShell(
    "/adventure/script",
    `
    <p class="quest-prose">Editorial notebook. Edit the JSON in git. This page does not save.</p>
    ${grouped
      .map(([chapterId, list]) => {
        const chapter = chapterById(quest, chapterId);
        return `
          <section class="stack quest-section">
            <h2 class="section-title">${esc(chapter?.destination || chapterId)}</h2>
            ${list
              .map((pack) => {
                const packModule = pack.moduleId ? moduleById(quest, pack.moduleId) : null;
                return `
                  <h3>${esc(packModule?.title || pack.moduleId || "Loose pages")}</h3>
                  ${(pack.items || [])
                    .map(
                      (item) => `
                    <details class="quest-script-item" data-status="${esc(item.status || "idea")}">
                      <summary>
                        <span class="quest-status">${esc(STATUS_LABEL[item.status] || item.status || "Idea")}</span>
                        <span class="quest-pill">${esc(item.type || "")}</span>
                        <strong>${esc(item.title)}</strong>
                        ${
                          item.exactLocation
                            ? `<span class="quest-prose">${esc(item.exactLocation)}</span>`
                            : ""
                        }
                      </summary>
                      ${itemFields(item)}
                    </details>`
                    )
                    .join("")}`;
              })
              .join("")}
          </section>`;
      })
      .join("")}`
  );

  return { html };
}
