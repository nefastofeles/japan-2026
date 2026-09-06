-- Japan 2026 - schema
-- Run this first, in the Supabase SQL editor.
--
-- Design note: there are only two auth accounts (one admin, one shared family
-- viewer). Family members are DATA, not accounts - see the `people` table.
-- Everything that needs attribution points at `people`, never at auth.users.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- admin flag
-- Which auth users may write. Deliberately has no RLS policy at all, so it is
-- unreadable from the client; only the security-definer function below reads it.
create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note    text
);
alter table app_admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (select 1 from app_admins where user_id = auth.uid());
$$;

-- ------------------------------------------------------------------- people
create table if not exists people (
  id     text primary key,          -- 'javier', 'rikke', 'saga', 'leo'
  name   text not null,
  short  text,
  colour text not null default '#1A1A1A',
  sort   int  not null default 0
);

-- --------------------------------------------------------------------- days
-- 24 rows: position 0 = pre-trip, 1..22 = travel days, 23 = post-trip.
create table if not exists days (
  id            uuid primary key default gen_random_uuid(),
  position      int  not null unique,
  kind          text not null default 'day' check (kind in ('pre','day','post')),
  date          date unique,        -- null for the pre/post pages
  slug          text unique,        -- 'before' / 'after'; travel days route by date
  leg           text not null,
  city          text,
  overnight     text,
  title         text not null,
  subtitle      text,
  summary       text,
  cover_media_id uuid,
  created_at    timestamptz not null default now()
);

create index if not exists days_position_idx on days (position);
create index if not exists days_date_idx     on days (date);

-- ------------------------------------------------------------------ entries
-- Free-form content blocks on a day: the story text, a quote, a voice note.
create table if not exists entries (
  id        uuid primary key default gen_random_uuid(),
  day_id    uuid not null references days(id) on delete cascade,
  person_id text references people(id),
  kind      text not null default 'text'
            check (kind in ('text','photo','gallery','video','map','quote','voice','best')),
  position  int  not null default 0,
  title     text,
  body      text,
  data      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists entries_day_idx on entries (day_id, position);

-- -------------------------------------------------------------------- meals
create table if not exists meals (
  id         uuid primary key default gen_random_uuid(),
  day_id     uuid not null references days(id) on delete cascade,
  slot       text not null default 'lunch'
             check (slot in ('breakfast','lunch','dinner','snack','konbini')),
  place_name text,
  place_url  text,
  dishes     jsonb not null default '[]'::jsonb,   -- [{ "en": "...", "jp": "...", "romaji": "..." }]
  price_yen  int,
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists meals_day_idx on meals (day_id);

create table if not exists meal_ratings (
  id        uuid primary key default gen_random_uuid(),
  meal_id   uuid not null references meals(id) on delete cascade,
  person_id text not null references people(id),
  score     int  not null check (score between 1 and 5),
  comment   text,
  unique (meal_id, person_id)
);

-- -------------------------------------------------------------------- media
-- Photos live in Supabase Storage. Videos live on unlisted YouTube and carry
-- provider='youtube' + external_id, with storage_path left null.
create table if not exists media (
  id           uuid primary key default gen_random_uuid(),
  day_id       uuid references days(id) on delete cascade,
  entry_id     uuid references entries(id) on delete set null,
  meal_id      uuid references meals(id) on delete set null,
  person_id    text references people(id),   -- who uploaded it
  shot_by      text references people(id),   -- who took it (director of the day)
  category     text not null default 'other'
               check (category in ('food','place','people','stamp','other')),
  provider     text not null default 'supabase'
               check (provider in ('supabase','youtube')),
  external_id  text,          -- YouTube 11-char id
  storage_path text,
  thumb_path   text,
  width        int,
  height       int,
  duration_s   int,
  bytes        int,
  taken_at     timestamptz,
  lat          double precision,
  lng          double precision,
  place        text,
  caption      text,
  is_favourite boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists media_day_idx      on media (day_id, taken_at);
create index if not exists media_meal_idx     on media (meal_id);
create index if not exists media_category_idx on media (category);
create index if not exists media_fav_idx      on media (is_favourite) where is_favourite;

alter table days
  drop constraint if exists days_cover_media_fk;
alter table days
  add constraint days_cover_media_fk
  foreign key (cover_media_id) references media(id) on delete set null;

-- -------------------------------------------------------------- predictions
-- Written before departure, hidden until revealed on the post-trip page.
create table if not exists predictions (
  id          uuid primary key default gen_random_uuid(),
  person_id   text references people(id),
  question    text not null,
  answer      text not null,
  outcome     text,
  revealed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------- comments & reactions
-- The family shares one viewer login, so commenters type their own name.
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references days(id) on delete cascade,
  author_name text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_day_idx on comments (day_id, created_at);

-- One row per tap. Counted in the app rather than kept as a running total,
-- which keeps the write policy simple and safe for the shared viewer account.
create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('day','media','meal')),
  target_id   uuid not null,
  emoji       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists reactions_target_idx on reactions (target_type, target_id);
