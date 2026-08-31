/* ==========================================================================
   Destination heroes - a landmark photograph for each city.
   --------------------------------------------------------------------------
   Open-licensed photos from Wikimedia Commons, resized and hosted here so
   the banners work offline. These are not trip photos. Once a day has a
   cover photograph from the family album it replaces the banner.
   Credits stay on the picture: the licences ask for the photographer's
   name. Full TASL lives in assets/heroes/ATTRIBUTION.md.
   ========================================================================== */

import { esc } from "../util.js";

const PHOTOS = {
  crane: {
    file: "crane.jpg",
    width: 1280,
    height: 783,
    alt: "Two origami paper cranes on a pale surface",
    credit: "Laitche",
    license: "Public domain",
    licenseUrl: "https://commons.wikimedia.org/wiki/File:Cranes_made_by_Origami_paper.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cranes_made_by_Origami_paper.jpg",
  },
  haneda: {
    file: "haneda.jpg",
    width: 1280,
    height: 717,
    alt: "An ANA airliner at a gate at Haneda Airport",
    credit: "Ka23 13",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Haneda_Airport_20160716_070223.jpg",
  },
  "senso-ji": {
    file: "senso-ji.jpg",
    width: 1280,
    height: 960,
    alt: "The Hōzōmon gate and five-storey pagoda at Sensō-ji in Asakusa",
    credit: "LMP 2001",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Sensoji_Temple_(Asakusa,_Tokyo,_Japan)_2023-07-02.jpg",
  },
  "fushimi-inari": {
    file: "fushimi-inari.jpg",
    width: 1280,
    height: 853,
    alt: "The vermillion torii tunnel at Fushimi Inari in Kyoto",
    credit: "Paul Vlaar",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:KyotoFushimiInariLarge.jpg",
  },
  "osaka-castle": {
    file: "osaka-castle.jpg",
    width: 1280,
    height: 838,
    alt: "Osaka Castle keep above the stone walls, with the city skyline behind",
    credit: "663highland",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Osaka_Castle_02bs3200.jpg",
  },
  "peace-memorial": {
    file: "peace-memorial.jpg",
    width: 1280,
    height: 849,
    alt: "The Hiroshima Peace Memorial, also called the Genbaku Dome",
    credit: "Jakub Hałun",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Hiroshima_Peace_Memorial_(Genbaku_Dome),_20240817_1050_4231.jpg",
  },
  itsukushima: {
    file: "itsukushima.jpg",
    width: 1280,
    height: 854,
    alt: "The floating torii gate at Itsukushima Shrine on Miyajima",
    credit: "JordyMeow",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Itsukushima_Gate.jpg",
  },
  kenrokuen: {
    file: "kenrokuen.jpg",
    width: 1280,
    height: 851,
    alt: "The Kotoji lantern beside the pond at Kenroku-en in Kanazawa",
    credit: "663highland",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:131109_Kenrokuen_Kanazawa_Ishikawa_pref_Japan01s3.jpg",
  },
  sanmachi: {
    file: "sanmachi.jpg",
    width: 1280,
    height: 853,
    alt: "A wooden merchant street in Sanmachi Suji, Takayama",
    credit: "Raita Futo",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Hida_Takayama_old_town_streets_(48519369602).jpg",
  },
  magome: {
    file: "magome.jpg",
    width: 1280,
    height: 853,
    alt: "The stone-paved slope through Magome-juku on the Nakasendo",
    credit: "663highland",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:220727_Nakasendo_Magome-juku_Nakatsugawa_Gifu_pref_Japan02s3.jpg",
  },
  "tokyo-tower": {
    file: "tokyo-tower.jpg",
    width: 1280,
    height: 720,
    alt: "Tokyo Tower lit orange above the Minato skyline at night",
    credit: "David Kernan",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tokyo_Tower,_Minato_City.jpg",
  },
};

const HEROES = {
  before: { photo: "crane", place: "Getting ready", placeJp: "準備" },
  inbound: { photo: "haneda", place: "Haneda", placeJp: "羽田" },
  shinjuku: { photo: "senso-ji", place: "Sensō-ji", placeJp: "浅草寺" },
  kyoto: { photo: "fushimi-inari", place: "Fushimi Inari", placeJp: "伏見稲荷" },
  osaka: { photo: "osaka-castle", place: "Osaka Castle", placeJp: "大阪城" },
  hiroshima: { photo: "peace-memorial", place: "Peace Memorial", placeJp: "平和記念公園" },
  miyajima: { photo: "itsukushima", place: "Itsukushima", placeJp: "厳島神社" },
  kanazawa: { photo: "kenrokuen", place: "Kenroku-en", placeJp: "兼六園" },
  takayama: { photo: "sanmachi", place: "Sanmachi Suji", placeJp: "三町筋" },
  kiso: { photo: "magome", place: "Magome-juku", placeJp: "馬籠宿" },
  tokyo: { photo: "tokyo-tower", place: "Tokyo Tower", placeJp: "東京タワー" },
  outbound: { photo: "haneda", place: "Haneda, homeward", placeJp: "羽田" },
  after: { photo: "crane", place: "Home again", placeJp: "帰り" },
};

export function destinationHero(leg, { compact = false } = {}) {
  const hero = HEROES[leg];
  const photo = hero && PHOTOS[hero.photo];
  if (!hero || !photo) return "";

  const classes = ["place-hero"];
  if (compact) classes.push("place-hero--compact");

  return `<figure class="${classes.join(" ")}" data-leg="${esc(leg)}" data-hero="${esc(leg)}">
            <img class="place-hero__photo"
                 src="assets/heroes/${esc(photo.file)}"
                 alt="${esc(photo.alt)}"
                 width="${photo.width}" height="${photo.height}"
                 ${compact ? 'loading="lazy"' : 'fetchpriority="high"'}
                 decoding="async">
            <figcaption class="place-hero__caption">
              <span class="place-hero__names">
                <span class="place-hero__place">${esc(hero.place)}</span>
                <span class="place-hero__jp jp">${esc(hero.placeJp)}</span>
              </span>
              <span class="place-hero__credit">
                Photo
                <a href="${esc(photo.sourceUrl)}" rel="noreferrer" target="_blank">${esc(photo.credit)}</a>
                ·
                <a href="${esc(photo.licenseUrl)}" rel="noreferrer" target="_blank">${esc(photo.license)}</a>
              </span>
            </figcaption>
          </figure>`;
}
