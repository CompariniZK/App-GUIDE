-- ============================================================================
-- Migration 003 — store Stripe customer/subscription ids on the profile
-- ----------------------------------------------------------------------------
-- Needed for the MONTHLY subscription paywall: subscription lifecycle events
-- (customer.subscription.deleted, invoice.payment_failed) don't carry our
-- user_id in a reliable field, so we map them back via the Stripe customer id.
-- The webhook (service role) writes these; users never set them.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================================

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);
