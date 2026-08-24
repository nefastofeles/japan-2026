-- Japan 2026 - row level security
-- Run this second.
--
-- The rules in one sentence: anyone signed in can read everything and can leave
-- a comment or a reaction; only the admin can create, change or delete content.
-- Nothing is readable when signed out.

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
-- signed in (that is: you, or the shared family viewer account)
do $$
declare t text;
begin
  foreach t in array array[
    'people','days','entries','meals','meal_ratings','media','predictions','comments','reactions'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
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
