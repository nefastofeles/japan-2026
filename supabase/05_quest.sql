-- Japan 2026 - Quest shared progress
--
-- Run after 01–04. It needs public.is_admin() from 01_schema.sql.
-- It does not alter days, entries, meals, media, comments, reactions,
-- people, or storage policies.
--
-- Auth: reuse the planned shared family viewer (authenticated) and the
-- facilitator in app_admins. Do not invent a second login. Anonymous
-- visitors keep playing on this phone via localStorage; they must not
-- read or wipe the family's shared Quest rows.
--
-- Photos: keep Quest snaps in IndexedDB. The journal buckets stay
-- admin-only.

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

-- Family phones may keep generation in localStorage. They must not
-- raise or lower the shared counter: that is the wipe signal.
create or replace function public.quest_control_protect_generation()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if TG_OP = 'INSERT' then
      NEW.reset_generation := 0;
    elsif NEW.reset_generation is distinct from OLD.reset_generation then
      NEW.reset_generation := OLD.reset_generation;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists quest_control_protect_generation on quest_control;
create trigger quest_control_protect_generation
  before insert or update on quest_control
  for each row
  execute procedure public.quest_control_protect_generation();

-- Re-runs drop both the old open policies and the current names.
do $$
declare t text;
begin
  foreach t in array array[
    'quest_progress', 'quest_memories', 'quest_badges', 'quest_control'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format('drop policy if exists %I on %I', t || '_write', t);
    execute format('drop policy if exists %I on %I', t || '_update', t);
    execute format('drop policy if exists %I on %I', t || '_delete', t);
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('drop policy if exists %I on %I', t || '_insert', t);
  end loop;
end $$;

-- Signed-in family: play. Facilitator (is_admin): wipe. Anon: nothing.
create policy quest_progress_select on quest_progress
  for select to authenticated
  using (trip_id = 'japan-2026');
create policy quest_progress_insert on quest_progress
  for insert to authenticated
  with check (trip_id = 'japan-2026');
create policy quest_progress_update on quest_progress
  for update to authenticated
  using (trip_id = 'japan-2026')
  with check (trip_id = 'japan-2026');
create policy quest_progress_delete on quest_progress
  for delete to authenticated
  using (trip_id = 'japan-2026' and public.is_admin());

create policy quest_memories_select on quest_memories
  for select to authenticated
  using (trip_id = 'japan-2026');
create policy quest_memories_insert on quest_memories
  for insert to authenticated
  with check (trip_id = 'japan-2026');
create policy quest_memories_update on quest_memories
  for update to authenticated
  using (trip_id = 'japan-2026')
  with check (trip_id = 'japan-2026');
create policy quest_memories_delete on quest_memories
  for delete to authenticated
  using (trip_id = 'japan-2026' and public.is_admin());

create policy quest_badges_select on quest_badges
  for select to authenticated
  using (trip_id = 'japan-2026');
create policy quest_badges_insert on quest_badges
  for insert to authenticated
  with check (trip_id = 'japan-2026');
create policy quest_badges_update on quest_badges
  for update to authenticated
  using (trip_id = 'japan-2026')
  with check (trip_id = 'japan-2026');
create policy quest_badges_delete on quest_badges
  for delete to authenticated
  using (trip_id = 'japan-2026' and public.is_admin());

create policy quest_control_select on quest_control
  for select to authenticated
  using (trip_id = 'japan-2026');
create policy quest_control_insert on quest_control
  for insert to authenticated
  with check (trip_id = 'japan-2026');
create policy quest_control_update on quest_control
  for update to authenticated
  using (trip_id = 'japan-2026')
  with check (trip_id = 'japan-2026');
create policy quest_control_delete on quest_control
  for delete to authenticated
  using (trip_id = 'japan-2026' and public.is_admin());
