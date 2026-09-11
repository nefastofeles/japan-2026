/**
 * Quest content loader.
 *
 * Live playable content stays in missions JSON (split so no file
 * grows past a readable size). The Adventure Script is an editorial
 * notebook; status "live" items usually point at a liveMissionId
 * instead of duplicating the page.
 */

let cache = null;

async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function loadScript() {
  try {
    const manifest = await readJson("data/quest/script/manifest.json");
    const packs = await Promise.all(
      (manifest.files || []).map(async (file) => {
        const pack = await readJson(`data/quest/script/${file}`);
        return { file, ...pack };
      })
    );
    return packs;
  } catch (error) {
    console.warn("Adventure Script not loaded:", error.message);
    return [];
  }
}

async function readJsonArray(path) {
  try {
    const data = await readJson(path);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const EXTRA_MISSION_FILES = [
  "data/quest/missions-copenhagen.json",
  "data/quest/missions-tokyo.json",
  "data/quest/missions-tokyo-places.json",
  "data/quest/missions-tokyo-light.json",
];

export async function loadQuest() {
  if (cache) return cache;
  const [chapters, missions, extraMissions, codex, moreCodex, badges, story, discoveries, modules, moreModules, rewards, media, moreMedia, script] =
    await Promise.all([
      readJson("data/quest/chapters.json"),
      readJson("data/quest/missions.json"),
      Promise.all(EXTRA_MISSION_FILES.map(readJsonArray)),
      readJson("data/quest/codex.json"),
      readJsonArray("data/quest/codex-more.json"),
      readJson("data/quest/badges.json"),
      readJson("data/quest/story.json"),
      readJson("data/quest/discoveries.json"),
      readJson("data/quest/modules.json"),
      readJsonArray("data/quest/modules-more.json"),
      readJson("data/quest/rewards.json"),
      readJsonArray("data/quest/media.json"),
      readJsonArray("data/quest/media-more.json"),
      loadScript(),
    ]);
  cache = {
    chapters,
    missions: [...missions, ...extraMissions.flat()],
    codex: [...codex, ...moreCodex],
    badges,
    story,
    discoveries,
    modules: [...modules, ...moreModules],
    rewards,
    media: [...media, ...moreMedia],
    script,
  };
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

export function missionsForModule(quest, moduleId) {
  return quest.missions.filter((mission) => mission.moduleId === moduleId);
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
