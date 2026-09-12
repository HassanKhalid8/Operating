-- ═══════════════════════════════════════════════════════════
-- KhinsaOS — the whole backend.
--
-- Run once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again; every statement is written to be repeatable.
-- ═══════════════════════════════════════════════════════════

-- ── theme, and where the tape is up to ──
create table if not exists public.desk_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── one row per pinned doodle; the PNG itself lives in storage ──
create table if not exists public.doodles (
  id         uuid primary key,
  caption    text not null default '',
  path       text not null,
  created_at timestamptz not null default now()
);

alter table public.desk_state enable row level security;
alter table public.doodles    enable row level security;

-- ── who may do what ──
-- The site has no login, so every visitor arrives as the `anon` role and the
-- anon key ships inside the JavaScript bundle. Anyone holding the link can
-- therefore do everything below. That is an accepted trade for a private,
-- unguessable URL sent to one person — and the reason nothing sensitive is
-- ever stored here. Read SETUP.md before putting anything else in these tables.

drop policy if exists "anon reads desk state"   on public.desk_state;
drop policy if exists "anon adds desk state"    on public.desk_state;
drop policy if exists "anon updates desk state" on public.desk_state;

create policy "anon reads desk state"   on public.desk_state for select to anon using (true);
create policy "anon adds desk state"    on public.desk_state for insert to anon with check (true);
create policy "anon updates desk state" on public.desk_state for update to anon using (true) with check (true);

drop policy if exists "anon reads doodles"   on public.doodles;
drop policy if exists "anon adds doodles"    on public.doodles;
drop policy if exists "anon updates doodles" on public.doodles;
drop policy if exists "anon removes doodles" on public.doodles;

create policy "anon reads doodles"   on public.doodles for select to anon using (true);
create policy "anon adds doodles"    on public.doodles for insert to anon with check (true);
-- Needed because an upload that is retried after a half-failure upserts its row.
create policy "anon updates doodles" on public.doodles for update to anon using (true) with check (true);
create policy "anon removes doodles" on public.doodles for delete to anon using (true);

-- ── the bucket the PNGs go in ──
insert into storage.buckets (id, name, public)
values ('doodles', 'doodles', true)
on conflict (id) do update set public = true;

drop policy if exists "anon reads doodle files"   on storage.objects;
drop policy if exists "anon adds doodle files"    on storage.objects;
drop policy if exists "anon removes doodle files" on storage.objects;

create policy "anon reads doodle files"   on storage.objects for select to anon using (bucket_id = 'doodles');
create policy "anon adds doodle files"    on storage.objects for insert to anon with check (bucket_id = 'doodles');
create policy "anon removes doodle files" on storage.objects for delete to anon using (bucket_id = 'doodles');
