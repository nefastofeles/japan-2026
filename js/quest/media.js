/**
 * Quest media catalog. Missing src falls back to a chapter photograph so
 * every card still has a place-specific picture. Reveal images stay hidden
 * until the mission is complete, so Find pages are not spoiled.
 */

const CHAPTER_ART = {
  prologue: {
    src: "assets/heroes/haneda.jpg",
    alt: "Haneda Airport at first light",
    credit: "Ka23 13",
  },
  tokyo: {
    src: "assets/heroes/tokyo-tower.jpg",
    alt: "Tokyo Tower over the city",
    credit: "David Kernan",
  },
  kyoto: {
    src: "assets/heroes/fushimi-inari.jpg",
    alt: "The vermilion tunnel at Fushimi Inari",
    credit: "Paul Vlaar",
  },
  osaka: {
    src: "assets/heroes/osaka-castle.jpg",
    alt: "Osaka Castle above the trees",
    credit: "663highland",
  },
  hiroshima: {
    src: "assets/heroes/peace-memorial.jpg",
    alt: "The Atomic Bomb Dome beside the river",
    credit: "Jakub Hałun",
  },
  miyajima: {
    src: "assets/heroes/itsukushima.jpg",
    alt: "The great torii of Itsukushima standing in the sea",
    credit: "JordyMeow",
  },
  kanazawa: {
    src: "assets/heroes/kenrokuen.jpg",
    alt: "Kenrokuen garden in Kanazawa",
    credit: "663highland",
  },
  takayama: {
    src: "assets/heroes/sanmachi.jpg",
    alt: "Wooden merchant houses on Sanmachi Suji",
    credit: "Raita Futo",
  },
  tsumago: {
    src: "assets/heroes/magome.jpg",
    alt: "A Nakasendo post-town street",
    credit: "663highland",
  },
  tokoname: {
    src: "assets/quest/dokanzaka.jpg",
    alt: "Ceramic pipes and pot walls along Tokoname’s Pottery Footpath",
    credit: "Bariston",
  },
  finale: {
    src: "assets/quest/ebisu-dusk.jpg",
    alt: "Dusk at Yebisu Garden Place, a calm Tokyo evening",
    credit: "hiroshi nakano",
  },
};

const ROLE_ORDER = [
  "hero",
  "journey",
  "during",
  "historical",
  "clue",
  "diagram",
  "illustration",
  "codex",
];

export function mediaById(quest, id) {
  if (!id) return null;
  return (quest?.media || []).find((item) => item.id === id) || null;
}

export function chapterArt(chapterId) {
  return CHAPTER_ART[chapterId] || null;
}

function asVisual(slot) {
  if (!slot?.src) return null;
  return {
    type: slot.type || "image",
    src: slot.src,
    alt: slot.alt || "",
    credit: slot.credit || "",
    role: slot.role || "",
  };
}

function usable(slot, complete) {
  if (!slot?.src) return false;
  if (slot.status === "family-wait") return false;
  if (slot.role === "reveal" && !complete) return false;
  if (slot.role === "codex" && !complete) return false;
  if (slot.role === "family") return false;
  return true;
}

function firstUsable(slots, complete) {
  for (const slot of slots) {
    if (usable(slot, complete)) return asVisual(slot);
  }
  return null;
}

function byModule(quest, moduleId, complete) {
  if (!moduleId) return null;
  const ranked = (quest?.media || [])
    .filter((item) => item.moduleId === moduleId)
    .sort((a, b) => {
      const rank = (role) => {
        const index = ROLE_ORDER.indexOf(role);
        return index === -1 ? 50 : index;
      };
      return rank(a.role) - rank(b.role);
    });
  return firstUsable(ranked, complete);
}

export function resolveVisual(item, quest, { complete } = {}) {
  if (item?.visual?.src) return item.visual;
  const id =
    item?.mediaId ||
    (typeof item?.visual === "string" ? item.visual : item?.visual?.id);
  const named = firstUsable([mediaById(quest, id)], complete);
  if (named) return named;
  const fromModule = byModule(quest, item?.moduleId, complete);
  if (fromModule) return fromModule;
  const art = chapterArt(item?.chapterId);
  return art ? { type: "image", ...art } : null;
}
