# Japan 2026

A private family journal of our trip to Japan, 15 September to 6 October 2026.
Javier, Rikke, Saga and Leo.

It is also the project we use to learn how to build things. See `AGENTS.md`
if you are Saga or Leo, and `IDEAS.md` for jobs that need doing.

## Running it

There is no build step. No npm, no framework, no compiling. Change a file,
reload the browser, see the change.

```bash
cd japan-2026
python3 -m http.server 8788
```

Then open <http://localhost:8788>.

You need the little server rather than double-clicking `index.html`, because
the site loads `data/itinerary.json` and browsers block that on `file://`.

## What is where

```
index.html              the shell: header, nav, an empty <main>
css/tokens.css          colours, type sizes, spacing. The safe playground
css/base.css            layout and typography
css/components.css      cards, buttons, forms
css/days.css            day strip, city list, day header
css/media.css           photos, lightbox, video, meals
css/home.css            countdown, stats, the route map
css/themes/             one file per person. Yours to wreck
js/app.js               start here. Registers the routes and boots the site
js/config.js            the two Supabase values. Also image sizes
js/router.js            turns #/day/2026-09-18 into a page
js/store.js             loads the plan and the memories
js/media.js             resize, thumbnail, read EXIF, upload
js/pages/               one file per page
js/components/          reusable pieces
data/itinerary.json     the whole trip: 24 days, legs, bookings
data/people.json        the four of us
supabase/               SQL to set up the database, run in order
tools/generate-seed.py  rebuilds 04_seed.sql from the itinerary
```

Nothing should get longer than about 300 lines. If a file is growing past
that, it is doing two jobs and wants splitting.

## Two kinds of data

This is the one idea worth understanding before changing anything.

**The plan** lives in `data/itinerary.json`, in git. Dates, legs,
accommodation, bookings, what we intend to do. It exists before the trip, it
can be edited in a pull request, and the site works with nothing else.

**The memories** live in Supabase. Photos, videos, meals, ratings, comments.
They only exist during and after the trip.

The journal still opens without a database, but it always asks for a login
first. Two accounts: the shared family login for reading, and the admin
login for posting. See `SETUP.md` for the emails.

## The 24 pages

Position 0 is the pre-trip page, 1 to 22 are the travel days, 23 is the
post-trip page. They are all the same template. The pre and post pages are
just days with `kind` set to `pre` and `post`, which means there are no
special cases anywhere in the code.

Eleven legs, each with a traditional Japanese colour:

| Leg | Colour | |
|---|---|---|
| Inbound | 浅葱 asagi | pale blue-green |
| Shinjuku | 朱 shu | vermilion |
| Kyoto | 藤 fuji | wisteria |
| Osaka | 柿 kaki | persimmon |
| Hiroshima | 群青 gunjō | ultramarine |
| Miyajima | 紅 beni | crimson |
| Kanazawa | 山吹 yamabuki | golden |
| Takayama | 松葉 matsuba | pine needle |
| Kiso Valley | 苔 koke | moss |
| Tokyo | 藍 ai | indigo |
| Outbound | 薄墨 usuzumi | pale ink |

## Photos and video

Photos are resized in the browser before they are uploaded: 2000px at about
400KB, plus a 400px thumbnail at about 40KB. Grids only ever load thumbnails.
Full size is fetched when you tap a photo. This is not fussiness, it is the
difference between staying inside the storage and bandwidth budget and
blowing through it in the first week.

Video does not go through this site at all. Clips are uploaded from the
YouTube app as **Unlisted**, and the link is pasted into the admin page.
YouTube does the transcoding and the streaming, for free.

## Setting up the backend

See `SETUP.md`. Until it is done, the plan still opens after you sign in.

## Before we fly

### Kit and accounts

- [ ] Set both iPhones to Settings, Camera, Formats, **Most Compatible**
- [ ] Two 256GB V30 microSD cards for the Pocket 3, set to 4K/30 in H.264
- [ ] A separate Google account for the trip's YouTube channel
- [ ] Send the family login round (`family` / the password in SETUP.md) and
      check a grandparent can sign in on their own phone
- [ ] Everyone writes their predictions before the airport

### Trip decisions still open

These came out of the planning spreadsheets and are not yet in
`data/itinerary.json`, because they are yours to decide rather than mine.

- [ ] **Grand Sumo, Aki Basho.** Time-critical. The tournament runs 13 to 27
      September at Ryogoku Kokugikan, so 16, 17 or 18 September all work, and
      mid-basho weekdays are the least contested. Tickets have been on sale
      since 8 August. Chair seats ¥3,500 to ¥8,500. If this is wanted, it is
      the one thing on the list that can sell out.
- [ ] **Ghibli Museum.** The research sheet says tickets were to be bought on
      10 August for a Tokyo day. If they were bought, tell me which day and
      what time and it goes in as a booking.
- [ ] **Entry times** for Skytree, the three teamLab venues and Ninja-dera.
      Currently in the itinerary with no time against them.
- [ ] **Super Nintendo World** is on the family wish list but Osaka has only
      two days and the trip DNA says no amusement parks. Decide or drop it.
- [ ] Confirm the Miyajima Airbnb has a private bath, since it is no longer
      the ryokan the original document assumed.
