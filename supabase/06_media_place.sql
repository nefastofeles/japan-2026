-- Add media.place if an older schema was applied without it.
-- Admin uploads send a place name; without this column PostgREST returns 400
-- and the photo sits in storage with no gallery row.

alter table public.media add column if not exists place text;
