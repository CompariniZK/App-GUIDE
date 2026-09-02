-- ============================================================================
-- Migration 002 — paywall: mark whether a user has paid the €1.99 access fee
-- ----------------------------------------------------------------------------
-- The webapp requires a one-time €1.99 payment (via Stripe) to unlock the app.
-- `has_paid` is set to true by the Stripe webhook (backend, using the service
-- role key). Users can READ their own has_paid via the existing RLS SELECT
-- policy, but cannot set it themselves (no client UPDATE of this column).
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================================

alter table public.profiles
  add column if not exists has_paid boolean not null default false;

-- Optional: record each payment for auditing / support.
create table if not exists public.payments (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  stripe_session text,
  amount_cents   integer,
  currency       text,
  status         text,
  created_at     timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

-- Users can read their own payment history; only the backend (service role,
-- which bypasses RLS) writes rows.
drop policy if exists "payments: read own" on public.payments;
create policy "payments: read own"
  on public.payments for select
  using (auth.uid() = user_id);

-- Verify:
--   select column_name from information_schema.columns
--   where table_name = 'profiles' and column_name = 'has_paid';
