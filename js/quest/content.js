/**
 * Quest content loader.
 *
 * Authored JSON, not the itinerary. Chapters point at itinerary legs and
 * date ranges so destinations are not copied out of itinerary.json.
 */

let cache = null;

async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

export async function loadQuest() {
  if (cache) return cache;
  const [chapters, missions, codex, badges, story, discoveries] = await Promise.all([
    readJson("data/quest/chapters.json"),
    readJson("data/quest/missions.json"),
    readJson("data/quest/codex.json"),
    readJson("data/quest/badges.json"),
    readJson("data/quest/story.json"),
    readJson("data/quest/discoveries.json"),
  ]);
  cache = { chapters, missions, codex, badges, story, discoveries };
  return cache;
}

export function chapterById(quest, id) {
  return quest.chapters.find((chapter) => chapter.id === id) || null;
}

export function missionById(quest, id) {
  return quest.missions.find((mission) => mission.id === id) || null;
}

export function missionsForChapter(quest, chapterId) {
  return quest.missions.filter((mission) => mission.chapterId === chapterId);
}

export function codexById(quest, id) {
  return quest.codex.find((entry) => entry.id === id) || null;
}

export function badgeById(quest, id) {
  return quest.badges.find((badge) => badge.id === id) || null;
}

export function discoveryById(quest, id) {
  return (quest.discoveries || []).find((item) => item.id === id) || null;
}

export function discoveryForCodex(quest, codexId) {
  return (quest.discoveries || []).find(
    (item) => item.codexId === codexId || item.id === codexId
  ) || null;
}
