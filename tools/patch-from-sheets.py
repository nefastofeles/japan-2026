#!/usr/bin/env python3
"""One-off patch: fold the Google Sheets planning data into data/itinerary.json.

Sources, in order of authority:
  1. "Japan med Family 2026"  - the master sheet, modified 24 Aug 2026.
     Real flight times, real accommodation per night, and the Nara and
     Shirakawa-go days. This is the source of truth for anything factual.
  2. "2026-08-10-Japan-2026-Historical-Weather" - four years of daily
     observations per leg, averaged here into a per-leg expectation.
  3. "japan_activities_v2" - the deep research sheet. Its Day-by-Day tab
     disagrees with the master (it has the arrival on 15 Sept and the
     Nakasendo hike on 3 Oct) and is NOT used for structure, only for the
     cultural additions that the master confirms.

Run once. Kept in the repo as a record of where the data came from.
"""

import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PATH = ROOT / "data" / "itinerary.json"

# ---------------------------------------------------------------- lodging
# Every night, from the master sheet's Hotel column.
OVERNIGHT = {
    "2026-09-15": "In flight",
    "2026-09-16": "Granbell Hotel Shinjuku",
    "2026-09-17": "Granbell Hotel Shinjuku",
    "2026-09-18": "Granbell Hotel Shinjuku",
    "2026-09-19": "Airbnb in Gion",
    "2026-09-20": "Airbnb in Gion",
    "2026-09-21": "Airbnb in Gion",
    "2026-09-22": "Airbnb in Gion",
    "2026-09-23": "Hotel Monterey, Namba",
    "2026-09-24": "Hotel Monterey, Namba",
    "2026-09-25": "Hotel Granvia Hiroshima",
    "2026-09-26": "Airbnb on Miyajima",
    "2026-09-27": "SOKI Kanazawa",
    "2026-09-28": "SOKI Kanazawa",
    "2026-09-29": "SOKI Kanazawa",
    "2026-09-30": "Wat Hotel & Spa, Takayama",
    "2026-10-01": "Wat Hotel & Spa, Takayama",
    "2026-10-02": "Spring Sunny Hotel, Tokoname",
    "2026-10-03": "Tokyu Stay Ebisu",
    "2026-10-04": "Tokyu Stay Ebisu",
    "2026-10-05": "Tokyu Stay Ebisu",
    "2026-10-06": "Home",
}

# The Tokyo return block is based in Ebisu, not the neighbourhoods the
# original document guessed at.
CITY = {
    "2026-10-03": "Tokoname to Tokyo",
    "2026-10-04": "Tokyo, Ebisu",
    "2026-10-05": "Tokyo, Ebisu",
}

TRANSIT = {
    "2026-09-15": "CPH to Haneda, departing 12:45. Overnight in the air, landing 07:55 tomorrow.",
    "2026-09-16": "Land at Haneda 07:55. Keikyu Line to Shinagawa (~20 min, ¥300), then on to Shinjuku.",
    "2026-09-30": "Kanazawa to Takayama by Nohi Bus, stopping at Shirakawa-go on the way.",
    "2026-10-06": "Haneda to CPH, departing 11:45, landing 18:15. Keikyu from Shinagawa (~20 min) or the Monorail from Hamamatsucho.",
}

# ---------------------------------------------------------------- weather
# Mean of 2022-2025 daily observations across each stay, from the weather
# sheet (Open-Meteo ERA5). Rain is the total across the whole leg, averaged
# over the four years, which is the number that actually decides a rain jacket.
WEATHER = {
    "shinjuku":  {"high": 32, "low": 23, "rain": "18mm across the three days", "note": "Warm and humid. The hottest part of the trip."},
    "kyoto":     {"high": 29, "low": 21, "rain": "25mm across four days",      "note": "Still warm. Two of the last four years had a genuinely wet day."},
    "osaka":     {"high": 28, "low": 21, "rain": "usually dry",                "note": "Three of the last four years were bone dry. 2022 had 79mm in one day."},
    "hiroshima": {"high": 27, "low": 20, "rain": "usually dry",                "note": "The most reliably dry leg of the whole trip."},
    "miyajima":  {"high": 29, "low": 22, "rain": "light",                      "note": "Mild and calm. Good ferry weather every year on record."},
    "kanazawa":  {"high": 25, "low": 19, "rain": "32mm across three days",     "note": "The wettest leg. Kanazawa is famous for it. Pack the umbrellas here."},
    "takayama":  {"high": 25, "low": 14, "rain": "8mm across two days",        "note": "Noticeably cooler, especially mornings and evenings. First jacket weather."},
    "kiso":      {"high": 24, "low": 12, "rain": "almost none",                "note": "Coldest mornings of the trip, around 11C, and dry all four years. Good hiking weather."},
    "tokyo":     {"high": 25, "low": 19, "rain": "16mm across three days",     "note": "Cooler than the first Tokyo block. Early autumn proper."},
}

# ------------------------------------------------------------- watch list
WATCHLIST = [
    {"title": "Spirited Away", "year": 2001, "kind": "film", "why": "Essential Ghibli context before we go", "where": "Netflix"},
    {"title": "My Neighbour Totoro", "year": 1988, "kind": "film", "why": "The gentle way in, for Leo", "where": "Netflix"},
    {"title": "Lost in Translation", "year": 2003, "kind": "film", "why": "Shinjuku hotels and jet lag. Our first three nights", "where": "Prime"},
    {"title": "Tampopo", "year": 1985, "kind": "film", "why": "A whole film about caring too much about ramen", "where": "Mubi"},
    {"title": "The Wind Rises", "year": 2013, "kind": "film", "why": "Pre-war Japan, and a way into Hiroshima", "where": "Netflix"},
    {"title": "Shogun", "year": 2024, "kind": "series", "why": "Feudal Japan, and the world the Nakasendo road belongs to", "where": "Disney+"},
    {"title": "Midnight Diner: Tokyo Stories", "year": 2016, "kind": "series", "why": "A tiny Shinjuku izakaya, one story per episode", "where": "Netflix"},
    {"title": "The Makanai", "year": 2023, "kind": "series", "why": "Set in Gion, where we are staying", "where": "Netflix"},
    {"title": "Jiro Dreams of Sushi", "year": 2011, "kind": "documentary", "why": "Japanese perfectionism, in one restaurant", "where": "Netflix"},
]


def replace_block(day, when, items):
    """Replace one time-of-day block on a day, or add it if it is missing."""
    for block in day["activities"]:
        if block["when"] == when:
            block["items"] = items
            return
    day["activities"].append({"when": when, "items": items})


def main():
    data = json.loads(PATH.read_text("utf-8"))
    by_date = {d["date"]: d for d in data["days"] if d.get("date")}
    changes = []

    for date, value in OVERNIGHT.items():
        day = by_date[date]
        if day.get("overnight") != value:
            changes.append(f"{date} overnight: {day.get('overnight')!r} -> {value!r}")
            day["overnight"] = value

    for date, value in CITY.items():
        day = by_date[date]
        if day.get("city") != value:
            changes.append(f"{date} city: {day.get('city')!r} -> {value!r}")
            day["city"] = value

    for date, value in TRANSIT.items():
        by_date[date]["transit"] = value
        changes.append(f"{date} transit updated")

    # 22 Sept is a Nara day trip, not a fourth day of Kyoto temples.
    nara = by_date["2026-09-22"]
    nara["title"] = "Nara: Deer, and the Great Buddha"
    nara["subtitle"] = "A day trip out of Kyoto"
    nara["transit"] = "Kyoto to Nara on the Kintetsu limited express, about 35 minutes."
    nara["activities"] = [
        {"when": "Morning", "items": [
            "Nara Park. Twelve hundred deer roaming free, and they bow for shika senbei crackers. Leo will not want to leave",
            "Todai-ji. The Great Buddha Hall is one of the largest wooden buildings in the world and the bronze Buddha inside is 15 metres tall",
            "The pillar at the back of the hall with a hole the size of the Buddha's nostril. Children squeeze through it for good luck",
        ]},
        {"when": "Lunch", "items": [
            "Kakinoha-zushi, sushi wrapped in persimmon leaves. The Nara speciality",
            "Or warabimochi and kudzu sweets around Sanjo-dori",
        ]},
        {"when": "Afternoon", "items": [
            "Kasuga Taisha. Three thousand stone and bronze lanterns along the approach through the forest",
            "Isuien Garden if there is time, small and beautifully composed",
            "Back to Kyoto in the late afternoon",
        ]},
        {"when": "Evening", "items": [
            "Last Kyoto dinner. Kaiseki is the splurge, ¥8,000 to ¥15,000 each",
            "Pack for Osaka",
        ]},
    ]
    nara["food"] = ["Kakinoha-zushi", "Warabimochi", "Final Kyoto kaiseki"]
    changes.append("2026-09-22 rewritten as the Nara day trip")

    # Shirakawa-go sits on the Kanazawa to Takayama bus route.
    takayama = by_date["2026-09-30"]
    replace_block(takayama, "Midday", [
        "Shirakawa-go, a UNESCO village of gassho-zukuri farmhouses with steep thatched roofs built to shed heavy snow",
        "The Shiroyama viewpoint over the whole valley is the photograph everyone knows",
        "Wada House, the largest of the farmhouses, is open to walk through",
    ])
    takayama["subtitle"] = "Shirakawa-go on the way, then old town and Hida beef"
    changes.append("2026-09-30 Shirakawa-go added")

    data["reference"]["weather"] = WEATHER
    data["reference"]["watchlist"] = WATCHLIST
    changes.append("weather (4-year averages per leg) and watchlist added")

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Patched {PATH.relative_to(ROOT)}\n")
    for line in changes:
        print("  " + line)


if __name__ == "__main__":
    main()
