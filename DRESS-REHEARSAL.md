# Dress rehearsal — Saturday 29 August

A day out in Denmark, treated exactly like a day in Japan. The point is not
to test the code; it is to find out which part of the evening routine nobody
will actually do when they are tired.

Do it on a real day out, not at the kitchen table. Somewhere with patchy
signal is better, not worse.

## Before you leave the house

- [ ] Supabase is set up and `js/config.js` is filled in (`SETUP.md`)
- [ ] Both iPhones: Settings → Camera → Formats → **Most Compatible**
      (otherwise everything is HEIC and the browser cannot resize it)
- [ ] Pocket 3 charged, card in, set to **4K/30 in H.264** (not HEVC)
- [ ] The site opens on all four phones and the family login works
- [ ] Everyone knows today is a Japan day

## During the day

- [ ] Saga and Leo each take photos on their own phone
- [ ] One person is **Director of the Day** and carries the Pocket 3
- [ ] Shoot **three meals**, even if one is just a pastry. Photograph the food
      before eating it — this is the habit that has to become automatic
- [ ] One Pocket 3 clip of about 30 seconds. Do not shoot more; the point is
      the pipeline, not the footage

## The evening routine — time yourself

This is the real test. If it takes longer than fifteen minutes, something has
to be cut before Japan, not during it.

1. [ ] Trim the Pocket 3 clip on the phone, export
2. [ ] Upload it to YouTube as **Unlisted**, copy the link
3. [ ] Open `#/admin`, pick the day, paste the link
4. [ ] Upload the photos. Watch how long compression takes for twenty at once
5. [ ] Log all three meals with a place, a price and a score from each person
6. [ ] Write five sentences in the story box
7. [ ] Open the day page on a different phone and check it all appears

**Record the actual time here:** ________

## What to check afterwards

- [ ] Supabase → Reports → Storage. How many MB did one day cost? Multiply by
      22 and see whether the free tier survives the trip
- [ ] Did any photo land on the wrong day? EXIF timestamps are the usual cause
- [ ] Did the photos taken by Saga get credited to Saga?
- [ ] Open the day page on a phone with mobile data and see how heavy it feels
- [ ] Send the link to one grandparent and watch them sign in without help.
      This is the single most valuable test of the day

## Things that are allowed to go wrong

Uploads failing on bad signal is expected — the offline queue is in
`IDEAS.md`, not built yet. Note *how* it failed, so the retry gets built for
the right failure.

## What to change afterwards

Write it down while it is fresh. Anything that felt like a chore on a
relaxed Saturday in Denmark will simply not happen on day nine in Kanazawa.

---

Second rehearsal: **Saturday 5 September**, deliberately testing offline
upload. Turn mobile data off for the whole afternoon and see what survives.
