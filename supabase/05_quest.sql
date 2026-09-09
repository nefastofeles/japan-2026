-- Japan 2026 - Quest shared progress
--
-- Run after 01–04. It is not required for the journal. Quest keeps
-- working on one phone via localStorage until this file has been run
-- and js/config.js has the two keys. This file does not alter days,
-- entries, meals, media, comments or storage policies.
--
-- Why a separate schema: Saga completing a mission on one iPhone must
-- show up on Rikke’s phone. Journal tables are the wrong place: they
-- are admin-write, day-scoped, and mixed with photos of the trip.
--
-- Auth: reuse the planned shared family viewer account. Do not invent a
-- second login system. Writes here are allowed for any signed-in family
-- member because kids complete missions. Journal writes stay admin-only.
--
-- Photos: keep Quest snaps in IndexedDB for now. The existing photos
-- and thumbs buckets only accept admin uploads, which is correct for
-- the journal. Mixing mission photos into day galleries would leak
-- game shots into grandparents’ album. A quest-photos bucket can wait.

create table if not exists quest_progress (
  id            uuid primary key default gen_random_uuid(),
  trip_id       text not null default 'japan-2026',
  kind          text not null check (kind in ('mission', 'discovery')),
  item_id       text not null,
  completed_at  timestamptz not null default now(),
  completed_by  text,
  answer        text,
  participants  text[] not null default '{}',
  summary       text,
  unique (trip_id, kind, item_id)
);

create index if not exists quest_progress_trip_idx on quest_progress (trip_id);

create table if not exists quest_memories (
  id            uuid primary key default gen_random_uuid(),
  trip_id       text not null default 'japan-2026',
  client_key    text not null unique,
  date          date not null,
  mission_id    text,
  discovery_id  text,
  summary       text,
  participants  text[] not null default '{}',
  response      text,
  created_at    timestamptz not null default now()
);

create index if not exists quest_memories_trip_idx on quest_memories (trip_id, date);

create table if not exists quest_badges (
  trip_id    text not null default 'japan-2026',
  badge_id   text not null,
  earned_at  timestamptz not null default now(),
  primary key (trip_id, badge_id)
);

-- One row per trip: reset generation, open modules, callback answers.
-- Generation is how a facilitator wipe beats a stale phone that still
-- has dress-rehearsal completions in localStorage.
create table if not exists quest_control (
  trip_id            text primary key default 'japan-2026',
  reset_generation   int not null default 0,
  activated_modules  text[] not null default '{}',
  answers            jsonb not null default '{}',
  updated_at         timestamptz not null default now()
);

alter table quest_progress enable row level security;
alter table quest_memories enable row level security;
alter table quest_badges   enable row level security;
alter table quest_control  enable row level security;

-- Signed-in family can read and write Quest state. Not the journal.
-- The journal sign-in wall is off, so anon is also allowed here only:
-- otherwise four phones cannot share progress without a second login.
do $$
declare t text;
begin
  foreach t in array array['quest_progress', 'quest_memories', 'quest_badges', 'quest_control'] loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_read', t
    );
    execute format('drop policy if exists %I on %I', t || '_write', t);
    execute format(
      'create policy %I on %I for insert to anon, authenticated with check (true)',
      t || '_write', t
    );
    execute format('drop policy if exists %I on %I', t || '_update', t);
    execute format(
      'create policy %I on %I for update to anon, authenticated using (true) with check (true)',
      t || '_update', t
    );
    execute format('drop policy if exists %I on %I', t || '_delete', t);
    execute format(
      'create policy %I on %I for delete to anon, authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end $$;
