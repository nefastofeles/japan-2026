/* ==========================================================================
   Japan places - coordinates for the map and for live weather.
   --------------------------------------------------------------------------
   Approximate centres, good enough to pin a city and to ask Open-Meteo
   what it is doing there right now. Copenhagen is not here on purpose:
   putting it on the map zooms Japan into a blob.
   ========================================================================== */

import { getTravelDays } from "./store.js";

export const PLACES = {
  Tokyo: { lat: 35.6895, lng: 139.6917, label: "Tokyo" },
  "Tokyo, Ebisu": { lat: 35.6467, lng: 139.7101, label: "Ebisu" },
  Kyoto: { lat: 35.0116, lng: 135.7681, label: "Kyoto" },
  Osaka: { lat: 34.6937, lng: 135.5023, label: "Osaka" },
  Hiroshima: { lat: 34.3853, lng: 132.4553, label: "Hiroshima" },
  Miyajima: { lat: 34.2960, lng: 132.3197, label: "Miyajima" },
  Kanazawa: { lat: 36.5613, lng: 136.6562, label: "Kanazawa" },
  Takayama: { lat: 36.1461, lng: 137.2522, label: "Takayama" },
  "Magome to Tsumago": { lat: 35.5769, lng: 137.5722, label: "Kiso Valley" },
  "Tokoname to Tokyo": { lat: 34.8863, lng: 136.8320, label: "Tokoname" },
  Tokoname: { lat: 34.8865, lng: 136.8323, label: "Tokoname" },
  Nara: { lat: 34.6851, lng: 135.8048, label: "Nara" },
  Nagoya: { lat: 35.1815, lng: 136.9066, label: "Nagoya" },
};

/** Stops drawn on the illustrated map. Magome, Tsumago, Shirakawa-go and
    Tokoname are listed on their own so they do not vanish into a neighbour. */
export const MAP_CITIES = [
  {
    id: "tokyo", name: "Tokyo", jp: "東京", stage: 1,
    lat: 35.6895, lng: 139.6917, leg: "tokyo",
    wiki: "https://en.wikipedia.org/wiki/Tokyo",
    cities: ["Tokyo", "Tokyo, Ebisu"], extraDates: [],
  },
  {
    id: "kyoto", name: "Kyoto", jp: "京都", stage: 2,
    lat: 35.0116, lng: 135.7681, leg: "kyoto",
    wiki: "https://en.wikipedia.org/wiki/Kyoto",
    cities: ["Kyoto"], extraDates: [],
    nudgeY: -14,
  },
  {
    id: "nara", name: "Nara", jp: "奈良", stage: 3,
    lat: 34.6851, lng: 135.8048, leg: "kyoto",
    wiki: "https://en.wikipedia.org/wiki/Nara_(city)",
    cities: [], extraDates: ["2026-09-22"],
    nudgeX: 16, nudgeY: 10,
  },
  {
    id: "osaka", name: "Osaka", jp: "大阪", stage: 4,
    lat: 34.6937, lng: 135.5023, leg: "osaka",
    wiki: "https://en.wikipedia.org/wiki/Osaka",
    cities: ["Osaka"], extraDates: [],
    nudgeX: -14, nudgeY: 12,
  },
  {
    id: "hiroshima", name: "Hiroshima", jp: "広島", stage: 5,
    lat: 34.3853, lng: 132.4553, leg: "hiroshima",
    wiki: "https://en.wikipedia.org/wiki/Hiroshima",
    cities: ["Hiroshima"], extraDates: [],
  },
  {
    id: "miyajima", name: "Miyajima", jp: "宮島", stage: 6,
    lat: 34.296, lng: 132.3197, leg: "miyajima",
    wiki: "https://en.wikipedia.org/wiki/Itsukushima",
    cities: ["Miyajima"], extraDates: [],
    nudgeX: -14, nudgeY: 12,
  },
  {
    id: "kanazawa", name: "Kanazawa", jp: "金沢", stage: 7,
    lat: 36.5613, lng: 136.6562, leg: "kanazawa",
    wiki: "https://en.wikipedia.org/wiki/Kanazawa",
    cities: ["Kanazawa"], extraDates: [],
  },
  {
    id: "shirakawa-go", name: "Shirakawa-go", jp: "白川郷", stage: 8,
    lat: 36.2562, lng: 136.9062, leg: "takayama",
    wiki: "https://en.wikipedia.org/wiki/Shirakawa,_Gifu_(village)",
    cities: [],     extraDates: ["2026-09-30"],
    nudgeX: -16, nudgeY: -10,
  },
  {
    id: "takayama", name: "Takayama", jp: "高山", stage: 9,
    lat: 36.1461, lng: 137.2522, leg: "takayama",
    wiki: "https://en.wikipedia.org/wiki/Takayama,_Gifu",
    cities: ["Takayama"], extraDates: [],
    nudgeX: 14,
  },
  {
    id: "magome", name: "Magome", jp: "馬籠", stage: 10,
    lat: 35.5283, lng: 137.5694, leg: "kiso",
    wiki: "https://en.wikipedia.org/wiki/Magome-juku",
    cities: [], extraDates: ["2026-10-02"],
    nudgeX: -16, nudgeY: 14,
  },
  {
    id: "tsumago", name: "Tsumago", jp: "妻籠", stage: 11,
    lat: 35.5772, lng: 137.595, leg: "kiso",
    wiki: "https://en.wikipedia.org/wiki/Tsumago-juku",
    cities: [], extraDates: ["2026-10-02"],
    nudgeX: 18, nudgeY: -12,
  },
  {
    id: "nagoya", name: "Nagoya", jp: "名古屋", stage: 12,
    lat: 35.1815, lng: 136.9066, leg: "kiso",
    wiki: "https://en.wikipedia.org/wiki/Nagoya",
    cities: [], extraDates: ["2026-10-02", "2026-10-03"],
    nudgeY: 12,
  },
  {
    id: "tokoname", name: "Tokoname", jp: "常滑", stage: 13,
    lat: 34.8865, lng: 136.8323, leg: "tokyo",
    wiki: "https://en.wikipedia.org/wiki/Tokoname",
    cities: ["Tokoname to Tokyo"], extraDates: [],
    nudgeX: -10, nudgeY: 16,
  },
];

/** Trip order for the ink line. Miyajima is a spur off Hiroshima. */
export const MAP_ROUTE = [
  "tokyo", "kyoto", "nara", "osaka", "hiroshima", "miyajima",
  "kanazawa", "shirakawa-go", "takayama", "magome", "tsumago",
  "nagoya", "tokoname",
];

/** Overnight cities, used by the Before-page weather table. */
export const CITY_FOR_LEG = {
  inbound: "Tokyo",
  shinjuku: "Tokyo",
  kyoto: "Kyoto",
  osaka: "Osaka",
  hiroshima: "Hiroshima",
  miyajima: "Miyajima",
  kanazawa: "Kanazawa",
  takayama: "Takayama",
  kiso: "Magome to Tsumago",
  tokyo: "Tokyo, Ebisu",
  outbound: "Tokyo",
};

export function coordsForCity(city) {
  const place = PLACES[city];
  return place ? [place.lat, place.lng] : null;
}

/** Unique stay cities, in trip order. Transit days with " to " are skipped. */
export function weatherVenues() {
  const seen = new Set();
  const list = [];
  for (const day of getTravelDays()) {
    const place = PLACES[day.city];
    if (!place || seen.has(day.city)) continue;
    if (
      day.city.includes(" to ") &&
      day.city !== "Magome to Tsumago" &&
      day.city !== "Tokoname to Tokyo"
    ) {
      continue;
    }
    seen.add(day.city);
    list.push({
      city: day.city,
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      leg: day.leg,
    });
  }
  return list;
}
