# Ideas

Jobs that need doing. Pick one, make a branch, do it, open a pull request.

Tagged by who they suit, but nobody is stopped from taking any of them.

---

## Good first jobs — Leo

- [ ] **Choose the eleven leg colours.** They are in `css/tokens.css` with
      their real Japanese names. Try changing Osaka's persimmon to something
      else and see how the whole city changes. Learn the eleven names.
- [ ] **Turn your theme on.** `css/themes/leo.css` — uncomment the line in
      `index.html` and start changing things.
- [ ] **Redesign the rating pips.** They are plain circles now. Make them
      chopsticks, or onigiri, or tiny bowls. Look for `.pip`.
- [ ] **Pick the emoji** we can react with. `REACTION_EMOJI` in `js/config.js`.
- [ ] **Polaroid photos.** Give every photo in the grid a thick white border.
- [ ] **A snack wall** for the konbini page: hundreds of wrappers in a grid.

## Real programming — Saga

- [ ] **Auto-group photos into meals.** `clusterByTime` in `js/media.js`
      already groups photos taken within thirty minutes of each other. Build
      the screen that shows those groups and lets you confirm one as a meal.
      This turns twelve photos into one tap and is the difference between
      logging food and giving up on it.
- [ ] **The local time widget.** It exists on the home page. Make it better:
      show both Japan and Denmark, and say whether people at home are asleep.
- [ ] **Filter the food page** by who rated it highest.
- [ ] **The GPX track for 2 October.** Record the Magome to Tsumago walk on a
      phone, then draw the line on the map page with the photos pinned along
      it. The only day of the trip with a walking route.
- [ ] **An upload queue that survives going offline.** Right now a failed
      upload has to be retried by hand. Put the queue in localStorage and
      retry automatically when the signal comes back. This matters in the
      Kiso valley.
- [ ] **Keyboard shortcuts:** left and right arrows to move between days.

## For whoever wants them

- [ ] **Voice note of the day.** Thirty seconds with `MediaRecorder`, about
      200KB. In ten years this will be the best thing on the site.
- [ ] **Eki stamp collection.** Japanese stations have collectible stamps.
      The `stamp` photo category already exists; give it its own page.
- [ ] **Sealed predictions.** Written before we go, hidden until the post-trip
      page reveals them. The `predictions` table is already there.
- [ ] **Yen spent per day**, drawn as a chart. Meals already carry a price.
- [ ] **Print stylesheet** so the whole site exports as a PDF photo book.
- [ ] **Dark mode for the teamLab days.** `data-theme="dark"` already works —
      make the four teamLab days switch to it automatically.
- [ ] **Japanese word of the day** on each day page.
- [ ] **Director of the day.** `media.shot_by` is recorded. Show who shot the
      most on each day, and total it up on the post-trip page.

## Known rough edges

- [ ] Photos have no captions in the admin screen yet
- [ ] No way to delete a photo without going into Supabase
- [ ] The map uses one fixed coordinate per city rather than real positions
- [ ] `days.cover_media_id` exists in the database but nothing sets it
- [ ] No "unsorted tray" yet: photos must be assigned to a day at upload time
