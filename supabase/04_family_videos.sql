-- Family YouTube clips on the Before page.
-- These are memories, so they live in Supabase, not in the itinerary.
-- A photo-bucket wipe on 2026-09-11 ran `delete from media` and took
-- them with the test JPEGs. Re-run this if that happens again.

insert into media (id, day_id, provider, external_id, category, caption, created_at)
select
  v.id,
  d.id,
  'youtube',
  v.external_id,
  'other',
  v.caption,
  v.created_at
from (
  values
    (
      '66549364-da58-45f8-a0e9-595d9d8ac127'::uuid,
      '7Zi1j-EdMoE',
      'Saga Trip 2023',
      '2026-09-11 12:32:52+00'::timestamptz
    ),
    (
      '75e6d0ff-f92b-44ed-abb5-ab38d4e66a63'::uuid,
      'eWobOu0EAs4',
      'Leo Trip 2025',
      '2026-09-11 12:33:39+00'::timestamptz
    )
) as v(id, external_id, caption, created_at)
join days d on d.slug = 'before'
on conflict (id) do update
  set day_id = excluded.day_id,
      provider = excluded.provider,
      external_id = excluded.external_id,
      category = excluded.category,
      caption = excluded.caption;
