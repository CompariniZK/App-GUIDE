-- ============================================================================
-- Boussole — Database schema
-- ----------------------------------------------------------------------------
-- Paste this entire file into the Supabase SQL Editor (Dashboard → SQL Editor)
-- and run it ONCE. It's idempotent — safe to re-run.
--
-- Security model:
--  • Row-Level Security (RLS) is enabled on every table.
--  • Users can only SELECT/UPDATE/DELETE rows where auth.uid() = profile.id
--    (or auth.uid() = user_id for child tables).
--  • Profiles are auto-created on signup via a trigger on auth.users.
--  • Sensitive columns (email) are not exposed to the public schema by default.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per authenticated user. Linked to auth.users via id (FK).
-- DO NOT add password/email columns here — auth.users handles credentials.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text         check (char_length(full_name) <= 120),
  nationality     text         check (nationality ~ '^[A-Z]{2,3}$'),     -- ISO code
  situation       text         check (situation in (
                                        'student','worker','asylum-seeker','refugee',
                                        'family','resident','tourist','entrepreneur',
                                        'retired','other'
                                      )),
  city_id         text         check (char_length(city_id) <= 60),
  language        text not null default 'fr' check (language in ('fr','en','pt','es','ar')),
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update `updated_at`
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ── Auto-create profile on signup ───────────────────────────────────────────
-- When a user signs up via Supabase Auth, mirror a row into public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS on profiles ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT/DELETE intentionally NOT exposed to clients.
-- Inserts happen via the on_auth_user_created trigger.
-- Account deletion should go through an Edge Function (revoke + cascade).

-- ── completed_guides ────────────────────────────────────────────────────────
-- Track which guides each user has completed.
create table if not exists public.completed_guides (
  user_id     uuid not null references auth.users(id) on delete cascade,
  guide_id    text not null check (char_length(guide_id) <= 80),
  completed_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

alter table public.completed_guides enable row level security;

drop policy if exists "completed_guides: read own" on public.completed_guides;
create policy "completed_guides: read own"
  on public.completed_guides for select
  using (auth.uid() = user_id);

drop policy if exists "completed_guides: insert own" on public.completed_guides;
create policy "completed_guides: insert own"
  on public.completed_guides for insert
  with check (auth.uid() = user_id);

drop policy if exists "completed_guides: delete own" on public.completed_guides;
create policy "completed_guides: delete own"
  on public.completed_guides for delete
  using (auth.uid() = user_id);

-- ── favorites ───────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  guide_id   text not null check (char_length(guide_id) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites: read own" on public.favorites;
create policy "favorites: read own"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites: insert own" on public.favorites;
create policy "favorites: insert own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites: delete own" on public.favorites;
create policy "favorites: delete own"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ── chat_history (optional — for syncing chat across devices) ──────────────
-- Stores AI conversation history. WARNING: this is sensitive data
-- (immigration questions). RLS strict.
create table if not exists public.chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant','system')),
  content    text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages: read own" on public.chat_messages;
create policy "chat_messages: read own"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "chat_messages: insert own" on public.chat_messages;
create policy "chat_messages: insert own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "chat_messages: delete own" on public.chat_messages;
create policy "chat_messages: delete own"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Done. Verify with:
--   select * from public.profiles;            -- should be empty
--   select rolname from pg_roles;             -- supabase_auth_admin should exist
--   select relname, relrowsecurity from pg_class where relname in
--     ('profiles','completed_guides','favorites','chat_messages');
--   -- relrowsecurity should be `t` for all four.
-- ============================================================================
