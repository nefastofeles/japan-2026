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
  "data/quest/missions-kyoto-keep-1.json",
  "data/quest/missions-kyoto-keep-2.json",
  "data/quest/missions-nara.json",
  "data/quest/missions-osaka.json",
  "data/quest/missions-hiroshima-keep.json",
  "data/quest/missions-miyajima.json",
  "data/quest/missions-kanazawa.json",
  "data/quest/missions-takayama.json",
  "data/quest/missions-tsumago.json",
  "data/quest/missions-tokoname.json",
  "data/quest/missions-finale.json",
];

const EXTRA_DISCOVERY_FILES = [
  "data/quest/discoveries-more.json",
];

const EXTRA_CODEX_FILES = [
  "data/quest/codex-more.json",
  "data/quest/codex-destinations.json",
];

const EXTRA_MEDIA_FILES = [
  "data/quest/media-more.json",
  "data/quest/media-codex.json",
  "data/quest/media-badges.json",
];

export async function loadQuest() {
  if (cache) return cache;
  const [
    chapters, missions, extraMissions, codex, extraCodex,
    extraDiscoveries, extraMedia, badges, story, discoveries,
    modules, moreModules, rewards, media, script,
  ] = await Promise.all([
    readJson("data/quest/chapters.json"),
    readJson("data/quest/missions.json"),
    Promise.all(EXTRA_MISSION_FILES.map(readJsonArray)),
    readJson("data/quest/codex.json"),
    Promise.all(EXTRA_CODEX_FILES.map(readJsonArray)),
    Promise.all(EXTRA_DISCOVERY_FILES.map(readJsonArray)),
    Promise.all(EXTRA_MEDIA_FILES.map(readJsonArray)),
    readJson("data/quest/badges.json"),
    readJson("data/quest/story.json"),
    readJson("data/quest/discoveries.json"),
    readJson("data/quest/modules.json"),
    readJsonArray("data/quest/modules-more.json"),
    readJson("data/quest/rewards.json"),
    readJsonArray("data/quest/media.json"),
    loadScript(),
  ]);
  cache = {
    chapters,
    missions: [...missions, ...extraMissions.flat()],
    codex: [...codex, ...extraCodex.flat()],
    badges,
    story,
    discoveries: [...discoveries, ...extraDiscoveries.flat()],
    modules: [...modules, ...moreModules],
    rewards,
    media: [...media, ...extraMedia.flat()],
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

export function discoveriesForChapter(quest, chapterId) {
  return (quest.discoveries || []).filter((item) => item.chapterId === chapterId);
}

export function discoveriesForModule(quest, moduleId) {
  return (quest.discoveries || []).filter((item) => item.moduleId === moduleId);
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
