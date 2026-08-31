/* ==========================================================================
   Destination heroes - the landmark on each city, until a real photo exists.
   --------------------------------------------------------------------------
   These are drawings, not trip photos, so they can live in git. Once a day
   has a cover photograph it replaces the drawing.
   ========================================================================== */

import { esc } from "../util.js";

const HEROES = {
  before: {
    file: "crane.svg",
    place: "Getting ready",
    placeJp: "準備",
  },
  inbound: {
    file: "haneda.svg",
    place: "Haneda",
    placeJp: "羽田",
  },
  shinjuku: {
    file: "senso-ji.svg",
    place: "Sensō-ji",
    placeJp: "浅草寺",
  },
  kyoto: {
    file: "fushimi-inari.svg",
    place: "Fushimi Inari",
    placeJp: "伏見稲荷",
  },
  osaka: {
    file: "osaka-castle.svg",
    place: "Osaka Castle",
    placeJp: "大阪城",
  },
  hiroshima: {
    file: "peace-memorial.svg",
    place: "Peace Memorial",
    placeJp: "平和記念公園",
  },
  miyajima: {
    file: "itsukushima.svg",
    place: "Itsukushima",
    placeJp: "厳島神社",
  },
  kanazawa: {
    file: "kenrokuen.svg",
    place: "Kenroku-en",
    placeJp: "兼六園",
  },
  takayama: {
    file: "sanmachi.svg",
    place: "Sanmachi Suji",
    placeJp: "三町筋",
  },
  kiso: {
    file: "magome.svg",
    place: "Magome-juku",
    placeJp: "馬籠宿",
  },
  tokyo: {
    file: "tokyo-tower.svg",
    place: "Tokyo Tower",
    placeJp: "東京タワー",
  },
  outbound: {
    file: "haneda.svg",
    place: "Haneda, homeward",
    placeJp: "羽田",
  },
  after: {
    file: "crane.svg",
    place: "Home again",
    placeJp: "帰り",
  },
};

export function destinationHero(leg, { compact = false } = {}) {
  const hero = HEROES[leg];
  if (!hero) return "";

  const classes = ["place-hero"];
  if (compact) classes.push("place-hero--compact");

  return `<figure class="${classes.join(" ")}" data-leg="${esc(leg)}" data-hero="${esc(leg)}">
            <div class="place-hero__sun" aria-hidden="true"></div>
            <div class="place-hero__art" aria-hidden="true"></div>
            <figcaption class="place-hero__caption">
              <span class="place-hero__place">${esc(hero.place)}</span>
              <span class="place-hero__jp jp">${esc(hero.placeJp)}</span>
            </figcaption>
          </figure>`;
}
