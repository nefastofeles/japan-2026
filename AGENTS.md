# How to work on this project

This file is instructions for Cursor, and for Saga and Leo.

## What this is

A website about our family trip to Japan. Twenty-four pages: one before we
go, one for each of the twenty-two days, and one for after we get back.
Grandparents and cousins read it, so it has to be easy to read on a phone.

## The rules

**No build step.** No npm, no React, no compiling. Plain HTML, plain CSS,
and JavaScript modules. You change a file, you reload the page, you see the
change. Never add a tool that has to run before the site works.

**Small files.** Nothing over about 300 lines. If a file gets bigger than
that, split it up. A file you cannot read in one go is a file nobody will
fix later.

**Say what things are.** `dayStrip` not `ds`. `mealsForDay` not `getData2`.

**Escape anything a person typed.** Use `esc()` from `js/util.js` on names,
captions, comments, everything. Otherwise someone's apostrophe breaks the
page.

**Comments explain why, not what.** Do not write `// loop through the days`.
Do write `// Japan is 9 hours ahead, so a UTC date would land on the wrong day`.

**18px minimum text.** The people reading this most are grandparents. Do not
make anything smaller to fit more in.

## Where to change things

| I want to... | Open |
|---|---|
| change a colour or a font size | `css/tokens.css` |
| change how something looks | `css/components.css` |
| change what a page says | the file in `js/pages/` |
| fix the trip plan, dates, bookings | `data/itinerary.json` |
| add a new page | `js/pages/`, then register it in `js/app.js` |
| have your own look | `css/themes/yourname.css` |

## Two kinds of data

The **plan** is `data/itinerary.json`, in git. Dates, cities, bookings.

The **memories** are in Supabase. Photos, food, comments.

Never put a photo in git and never put the itinerary in the database. If you
are unsure which one a thing belongs to, ask: did this exist before the trip?
If yes it goes in the JSON file.

## How to make a change

1. Make a branch: `git checkout -b leo-blue-kyoto`
2. Change one thing
3. Look at it: `python3 -m http.server 8788`
4. Commit and push
5. Open a pull request on GitHub
6. Netlify builds you a real web address for your branch. Open it on your
   phone and show someone
7. When it is good, merge it

The point of the branch is that you cannot break the real site. Try things.

## Things that will trip you up

**Dates are strings, never timestamps.** Always `"2026-09-18"`. Japan is nine
hours ahead of Denmark, so anything built out of `new Date()` and UTC will put
photos on the wrong day. Use `parseDate` from `js/util.js`.

**Grids load thumbnails, not photos.** Look at `photo-grid.js`. If you make a
grid load full-size images, the site will be slow and we will run out of our
bandwidth allowance. Full size is only for the lightbox.

**The site has to work without the database.** Every function that reads from
Supabase returns an empty list when it is not set up. Keep it that way, so
the plan is always readable.

**Do not commit secrets.** The Supabase anon key in `js/config.js` is fine, it
is designed to be public. Anything called `service_role` is not.

## If you get stuck

Open `js/app.js`. It is short, and it lists every page in the site. Follow the
one you care about.
