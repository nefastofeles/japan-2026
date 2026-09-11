-- Japan 2026 - storage buckets
-- Run this third.
--
-- Two public buckets. Galleries use stable public URLs, so a photo that
-- landed in the album is visible after refresh and in every browser.
--
-- 'thumbs' holds 400px versions at roughly 40KB. Grids must only ever load
-- from 'thumbs'; 'photos' is fetched on tap. This is what keeps egress sane.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('thumbs', 'thumbs', true,  1048576, array['image/jpeg','image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- read: anyone with the site. The login wall is off.
drop policy if exists "trip read photos" on storage.objects;
create policy "trip read photos" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('photos','thumbs'));

-- write: Admin posts without a Supabase session while the gate is off.
drop policy if exists "trip write photos" on storage.objects;
create policy "trip write photos" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('photos','thumbs'));

drop policy if exists "trip update photos" on storage.objects;
create policy "trip update photos" on storage.objects
  for update to authenticated
  using (bucket_id in ('photos','thumbs') and public.is_admin())
  with check (bucket_id in ('photos','thumbs') and public.is_admin());

drop policy if exists "trip delete photos" on storage.objects;
create policy "trip delete photos" on storage.objects
  for delete to authenticated
  using (bucket_id in ('photos','thumbs') and public.is_admin());
