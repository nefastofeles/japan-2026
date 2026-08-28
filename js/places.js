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
};

/** Overnight cities, used by the Before-page weather table. */
export const CITY_FOR_LEG = {
  shinjuku: "Tokyo",
  kyoto: "Kyoto",
  osaka: "Osaka",
  hiroshima: "Hiroshima",
  miyajima: "Miyajima",
  kanazawa: "Kanazawa",
  takayama: "Takayama",
  kiso: "Magome to Tsumago",
  tokyo: "Tokyo, Ebisu",
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
    if (day.city.includes(" to ") && day.city !== "Magome to Tsumago") continue;
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
