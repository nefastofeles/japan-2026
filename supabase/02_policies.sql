-- Japan 2026 - row level security
-- Run this second.
--
-- The family login wall is off, so the public anon key must be able to
-- read the album and Admin must be able to post without a Supabase
-- session. Tighten this back to authenticated-only when the gate
-- returns. The GitHub repo is private and the site is noindex.
--
-- Update and delete of journal rows still go through is_admin() for
-- signed-in facilitators.

alter table people       enable row level security;
alter table days         enable row level security;
alter table entries      enable row level security;
alter table meals        enable row level security;
alter table meal_ratings enable row level security;
alter table media        enable row level security;
alter table predictions  enable row level security;
alter table comments     enable row level security;
alter table reactions    enable row level security;

-- ------------------------------------------------------------ read: anyone
-- with the site (anon key) or a signed-in family session
do $$
declare t text;
begin
  foreach t in array array[
    'people','days','entries','meals','meal_ratings','media','predictions','comments','reactions'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_read', t
    );
  end loop;
end $$;

-- ----------------------------------------------------------- write: admin
do $$
declare t text;
begin
  foreach t in array array[
    'people','days','entries','meals','meal_ratings','media','predictions','reactions'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_admin_write', t);
    execute format(
      'create policy %I on %I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_write', t
    );
  end loop;
end $$;

-- Admin posting while nobody is signed in to Supabase.
drop policy if exists entries_insert on entries;
create policy entries_insert on entries
  for insert to anon, authenticated
  with check (true);

drop policy if exists meals_insert on meals;
create policy meals_insert on meals
  for insert to anon, authenticated
  with check (true);

drop policy if exists meal_ratings_insert on meal_ratings;
create policy meal_ratings_insert on meal_ratings
  for insert to anon, authenticated
  with check (true);

drop policy if exists media_insert on media;
create policy media_insert on media
  for insert to anon, authenticated
  with check (true);

-- --------------------------------------------- comments: any signed-in user
-- may leave one; only the admin may edit or delete.
drop policy if exists comments_insert on comments;
create policy comments_insert on comments
  for insert to authenticated
  with check (length(trim(body)) > 0 and length(trim(author_name)) > 0);

drop policy if exists comments_admin_write on comments;
create policy comments_admin_write on comments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------- reactions: any signed-in user
drop policy if exists reactions_insert on reactions;
create policy reactions_insert on reactions
  for insert to authenticated
  with check (true);
