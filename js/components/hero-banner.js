/* ==========================================================================
   Destination heroes - a landmark photograph for each city.
   --------------------------------------------------------------------------
   Open-licensed photos from Wikimedia Commons, resized and hosted here so
   the banners work offline. These are not trip photos. Once a day has a
   cover photograph from the family album it replaces the banner.
   Photographer credits live in assets/heroes/ATTRIBUTION.md, not on the
   picture: the banners should read as place names, not as a licence plate.
   ========================================================================== */

import { esc } from "../util.js";

const PHOTOS = {
  crane: {
    file: "crane.jpg",
    width: 1280,
    height: 783,
    alt: "Two origami paper cranes on a pale surface",
  },
  haneda: {
    file: "haneda.jpg",
    width: 1280,
    height: 717,
    alt: "An ANA airliner at a gate at Haneda Airport",
  },
  "senso-ji": {
    file: "senso-ji.jpg",
    width: 1280,
    height: 960,
    alt: "The Hōzōmon gate and five-storey pagoda at Sensō-ji in Asakusa",
  },
  "fushimi-inari": {
    file: "fushimi-inari.jpg",
    width: 1280,
    height: 853,
    alt: "The vermillion torii tunnel at Fushimi Inari in Kyoto",
  },
  "osaka-castle": {
    file: "osaka-castle.jpg",
    width: 1280,
    height: 838,
    alt: "Osaka Castle keep above the stone walls, with the city skyline behind",
  },
  "peace-memorial": {
    file: "peace-memorial.jpg",
    width: 1280,
    height: 849,
    alt: "The Hiroshima Peace Memorial, also called the Genbaku Dome",
  },
  itsukushima: {
    file: "itsukushima.jpg",
    width: 1280,
    height: 854,
    alt: "The floating torii gate at Itsukushima Shrine on Miyajima",
  },
  kenrokuen: {
    file: "kenrokuen.jpg",
    width: 1280,
    height: 851,
    alt: "The Kotoji lantern beside the pond at Kenroku-en in Kanazawa",
  },
  sanmachi: {
    file: "sanmachi.jpg",
    width: 1280,
    height: 853,
    alt: "A wooden merchant street in Sanmachi Suji, Takayama",
  },
  magome: {
    file: "magome.jpg",
    width: 1280,
    height: 853,
    alt: "The stone-paved slope through Magome-juku on the Nakasendo",
  },
  "tokyo-tower": {
    file: "tokyo-tower.jpg",
    width: 1280,
    height: 720,
    alt: "Tokyo Tower lit orange above the Minato skyline at night",
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
              <span class="place-hero__place">${esc(hero.place)}</span>
              <span class="place-hero__jp jp">${esc(hero.placeJp)}</span>
            </figcaption>
          </figure>`;
}
