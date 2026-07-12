-- ============================================================================
-- Migration 001 — allow the 'new_arrival' situation value
-- ----------------------------------------------------------------------------
-- BUG: the app's onboarding offers "Recém-chegado / new_arrival" (the first
-- option), but the original profiles.situation CHECK constraint did NOT include
-- it. Selecting it made the profile UPDATE fail silently, so nationality +
-- situation never persisted → the user was sent through onboarding again on
-- every login.
--
-- Run this ONCE in the Supabase SQL Editor. Safe / idempotent.
-- ============================================================================

alter table public.profiles
  drop constraint if exists profiles_situation_check;

alter table public.profiles
  add constraint profiles_situation_check
  check (situation in (
    'new_arrival','student','worker','asylum-seeker','refugee',
    'family','resident','tourist','entrepreneur','retired','other'
  ));

-- Verify:
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conname = 'profiles_situation_check';
-- The definition should now include 'new_arrival'.
