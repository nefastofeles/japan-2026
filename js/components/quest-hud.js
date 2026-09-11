/**
 * Compact Quest HUD. Uses the same fragment/XP/reward numbers as the
 * rest of the game. Memory chapters return nothing so Hiroshima stays
 * a record, not a scoreboard.
 */

import { esc } from "../util.js";
import { familyXp } from "../quest/engine.js";
import { chapterFragments, nextVisibleReward } from "../quest/progress.js";

function dots(earned, target, complete) {
  if (!target) return "";
  const filled = complete ? target : Math.min(earned, target);
  const marks = Array.from({ length: target }, (_, i) =>
    i < filled ? "●" : "○"
  ).join("");
  return `<span class="quest-hud__dots" aria-hidden="true">${marks}</span>`;
}

export function questHud(quest, state, chapter) {
  if (!chapter || !state || !quest) return "";
  if (chapter.tone === "memory") return "";
  if (chapter.id === "finale") return "";

  const xp = familyXp(quest, state);
  const bits = chapterFragments(quest, state, chapter.id);
  const next = nextVisibleReward(quest, state, xp);
  const complete = bits.target > 0 && bits.earned >= bits.target;
  const nextTitle = next?.title || "—";
  const chapterName = (chapter.destination || chapter.title || "").split(",")[0];
  const fragLabel = complete
    ? "Complete"
    : bits.target
      ? `${bits.earned} / ${bits.target}`
      : "In progress";
  const href = "#/adventure/map";

  return `
    <a class="quest-hud" href="${href}" aria-label="Family progress: ${esc(chapterName)}, ${esc(fragLabel)}, ${xp} family XP, next ${esc(nextTitle)}">
      <span class="quest-hud__chapter">${esc(chapterName)}</span>
      ${dots(bits.earned, bits.target, complete)}
      <span class="quest-hud__frag">${esc(fragLabel)}</span>
      <span class="quest-hud__xp">${xp} XP</span>
      <span class="quest-hud__next">Next: ${esc(nextTitle)}</span>
    </a>`;
}
