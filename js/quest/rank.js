/**
 * What the hub should offer first.
 *
 * Booked days (Skytree, teamLab) have to beat optional quizzes.
 * Lightweight fragment-0 cards stay in the library; they should not
 * fill the first screen when a real page is waiting.
 */

function packFor(quest, mission) {
  if (!mission?.moduleId) return null;
  return (quest?.modules || []).find((item) => item.id === mission.moduleId) || null;
}

export function bookedOnDate(mission, quest, date) {
  if (!mission || !date) return false;
  if (mission.date) return mission.date === date;
  const pack = packFor(quest, mission);
  return Boolean(pack?.activation === "booking" && pack.anchorDate === date);
}

function rankOf(mission, quest, date) {
  if (bookedOnDate(mission, quest, date)) return 0;
  if (mission.anchorEvent) return 1;
  const pack = packFor(quest, mission);
  // Library pages published for Journey keep fragmentValue 0 so they
  // do not fill the hub when a real chapter page is already waiting.
  if (pack && pack.optional === false && (mission.fragmentValue ?? 1) > 0) return 1;
  if ((mission.fragmentValue ?? 1) > 0) return 2;
  return 3;
}

/**
 * Incomplete, module-eligible missions, ordered for a family day.
 * Scheduled-for-another-day pages drop out. Fragment-0 quizzes drop
 * out once anything heavier is already on the list.
 */
export function surfaceMissions(missions, quest, date, statusOf) {
  const playable = (missions || []).filter((mission) => {
    const status = statusOf ? statusOf(mission) : "open";
    if (status === "done" || status === "locked") return false;
    if (status === "scheduled" && !bookedOnDate(mission, quest, date)) return false;
    return status === "open" || status === "nearby" || status === "scheduled";
  });

  playable.sort((left, right) => {
    const delta = rankOf(left, quest, date) - rankOf(right, quest, date);
    if (delta) return delta;
    return (right.xp || 0) - (left.xp || 0);
  });

  const heavy = playable.filter((mission) => rankOf(mission, quest, date) < 3);
  return heavy.length ? heavy : playable;
}
