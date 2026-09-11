/**
 * Chapter fragments and rewards.
 *
 * A city can hold many missions. The arc completes when enough fragments
 * are in, so optional modules can be skipped.
 */

import { isComplete, isDiscovered } from "./state.js";

export function fragmentValue(item, fallback = 1) {
  if (!item) return 0;
  if (typeof item.fragmentValue === "number") return item.fragmentValue;
  return fallback;
}

export function chapterFragments(quest, state, chapterId) {
  let earned = 0;
  for (const mission of quest.missions || []) {
    if (mission.chapterId !== chapterId) continue;
    if (!isComplete(state, mission.id)) continue;
    earned += fragmentValue(mission, 1);
  }
  for (const discovery of quest.discoveries || []) {
    if (discovery.chapterId !== chapterId) continue;
    const id = discovery.codexId || discovery.id;
    if (!isDiscovered(state, id)) continue;
    earned += fragmentValue(discovery, 0);
  }
  const chapter = (quest.chapters || []).find((item) => item.id === chapterId);
  const target = chapter?.fragmentTarget || 0;
  const pct = target ? Math.min(100, Math.round((earned / target) * 100)) : 0;
  return { earned, target, pct };
}

export function chapterComplete(quest, state, chapterId) {
  const { earned, target } = chapterFragments(quest, state, chapterId);
  if (!target) return false;
  return earned >= target;
}

export function rewardEarned(reward, { xp, fragmentsFor }) {
  const needsXp = typeof reward.xpThreshold === "number";
  const needsFrag = typeof reward.fragmentThreshold === "number";
  if (!needsXp && !needsFrag) return false;
  let ok = true;
  if (needsXp) ok = ok && xp >= reward.xpThreshold;
  if (needsFrag) {
    const chapterId = reward.chapterId;
    const bits = chapterId ? fragmentsFor(chapterId) : { earned: 0 };
    ok = ok && bits.earned >= reward.fragmentThreshold;
  }
  return ok;
}

export function nextVisibleReward(quest, state, xp) {
  const fragmentsFor = (chapterId) => chapterFragments(quest, state, chapterId);
  const visible = (quest.rewards || []).filter((reward) => !reward.hidden);
  return (
    visible.find((reward) => !rewardEarned(reward, { xp, fragmentsFor })) || null
  );
}
