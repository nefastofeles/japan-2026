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
import { questShell, listenBar, wireListen } from "../components/quest-chrome.js";

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
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item.text || item.id || ""))
      .filter(Boolean)
      .join(" / ");
  }
  if (typeof value === "object") {
    if (value.choices) {
      const choices = value.choices.map((choice) => choice.text).join(" · ");
      return `${value.text || ""} ${choices}`.trim();
    }
    return value.text || value.title || value.id || "";
  }
  return String(value);
}

function moreBlock(info) {
  if (!info?.text) return "";
  const title = info.title ? `${info.title}. ` : "";
  return title + info.text;
}

function itemFields(item) {
  const rows = [
    ["Priority", item.priority],
    ["Where", item.locationDescription],
    ["Exact spot", item.exactLocation],
    ["Hook", item.hook],
    ["Task", item.task],
    ["Question", asText(item.question)],
    ["Riddle", item.riddle],
    ["Story", asText(item.story)],
    ["Look at", asText(item.physicalObservation)],
    ["Follow-up", item.followUp],
    ["Hint", item.hint],
    ["Reveal", item.reveal],
    ["Tell me more", moreBlock(item.moreInfo)],
    ["History", item.historicalTheme],
    ["Mythology", item.mythologyTheme],
    ["Weird fact", item.weirdFact],
    ["Visual idea", item.visualIdea],
    ["Media", item.mediaId || asText(item.media)],
    ["Photo", item.photo ? (item.photoCount ? `${item.photoCount} photos` : "yes") : ""],
    ["Fragment", item.fragmentValue],
    ["XP", item.xp],
    ["Codex", item.codexUnlock],
    ["Save for", asText(item.saveFor)],
    ["Reward idea", item.rewardIdea],
    ["Fact check", item.factCheck],
    ["Notes", item.notes],
    ["Live mission", item.liveMissionId],
  ].filter(([, value]) => value);
  if (!rows.length) return `<p class="quest-prose">No extra notes yet.</p>`;
  return rows
    .map(([label, value]) => {
      const extra = label === "Fact check" ? " quest-fact" : "";
      return `<p class="quest-prose${extra}"><strong>${esc(label)}.</strong> ${esc(String(value))}</p>`;
    })
    .join("");
}

function listenCopy(item) {
  return [
    item.hook,
    item.task,
    asText(item.question),
    item.reveal,
    item.moreInfo?.audioText || item.moreInfo?.text,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function adventureScriptPage() {
  const quest = await loadQuest();
  const packs = quest.script || [];
  const texts = {};

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
    <p class="quest-prose">Editorial notebook. Edit the JSON in git. This page does not save. Approved is not live.</p>
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
                    .map((item) => {
                      const spoken = listenCopy(item);
                      if (spoken) texts[item.id] = spoken;
                      return `
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
                      ${spoken ? listenBar(item.id) : ""}
                      ${itemFields(item)}
                    </details>`;
                    })
                    .join("")}`;
              })
              .join("")}
          </section>`;
      })
      .join("")}`
  );

  return {
    html,
    mount(root) {
      wireListen(root, texts);
    },
  };
}
