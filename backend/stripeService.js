// ============================================================================
// stripeService.js — one-time €1.99 paywall for the Boussole web app
// ----------------------------------------------------------------------------
// Flow:
//   1. User signs up + logs in (Supabase). Frontend has a valid access token.
//   2. Frontend calls POST /api/stripe/create-checkout-session with the token.
//      We verify the token → get the real user → create a Stripe Checkout
//      session (mode: payment, 199 EUR cents) with client_reference_id = userId.
//   3. User pays on Stripe's hosted page.
//   4. Stripe calls POST /api/stripe/webhook. We verify the signature and, on
//      checkout.session.completed, set profiles.has_paid = true for that user
//      (via the Supabase service-role key, which bypasses RLS).
//
// The webhook — NOT the client — is the source of truth for payment status.
// Card data never touches this server; Stripe handles PCI.
// ============================================================================

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  WEB_APP_URL,
} = process.env;

// Amount is fixed server-side so the client can never choose the price.
const PRICE_CENTS = parseInt(process.env.STRIPE_PRICE_EUR_CENTS || '199', 10);
const CURRENCY = 'eur';
const PRODUCT_NAME = 'Boussole — Abonnement mensuel';

// Where Stripe sends the user back after checkout. Configurable per env.
const APP_URL = (WEB_APP_URL || 'https://boussole-web.netlify.app').replace(/\/$/, '');

// ─── Lazy singletons ─────────────────────────────────────────────────────────
let _stripe = null;
let _supabaseAdmin = null;

function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (!_stripe) _stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  return _stripe;
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

/** True when every required env var is present. Exposed via /api/health. */
export function stripeConfigured() {
  return Boolean(STRIPE_SECRET_KEY && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

// ─── POST /api/stripe/create-checkout-session ────────────────────────────────
// Auth: "Authorization: Bearer <supabase access_token>".
export async function createCheckoutSession(req, res) {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  if (!stripe || !supabase) {
    return res.status(503).json({ error: 'Payments are not configured yet.' });
  }

  // 1. Validate the caller's Supabase session and get the real user.
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' });

  let user;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session.' });
    user = data.user;
  } catch {
    return res.status(401).json({ error: 'Could not verify session.' });
  }

  // 2. If they already paid, don't charge again.
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_paid')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.has_paid) {
      return res.status(200).json({ alreadyPaid: true });
    }
  } catch {
    // Non-fatal: worst case we let them reach checkout; webhook is idempotent.
  }

  // 3. Create the Checkout session.
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: PRICE_CENTS,
            recurring: { interval: 'month' },
            product_data: { name: PRODUCT_NAME },
          },
        },
      ],
      // Propagate our user id onto the subscription so lifecycle events
      // (cancel, payment failure) can be mapped back to the right user.
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${APP_URL}/?paid=1`,
      cancel_url: `${APP_URL}/?canceled=1`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[stripe] create session failed:', err?.message || err);
    return res.status(502).json({ error: 'Could not start checkout.' });
  }
}

// ─── POST /api/stripe/create-portal-session ──────────────────────────────────
// Auth: "Authorization: Bearer <supabase access_token>".
// Opens the Stripe Customer Portal so the user can cancel / change their
// subscription and update their card themselves. Required by EU/French law:
// cancelling must be as easy as subscribing.
export async function createPortalSession(req, res) {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  if (!stripe || !supabase) {
    return res.status(503).json({ error: 'Payments are not configured yet.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' });

  let user;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session.' });
    user = data.user;
  } catch {
    return res.status(401).json({ error: 'Could not verify session.' });
  }

  // The Stripe customer id was stored on the profile at checkout.
  let customerId;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();
    customerId = profile?.stripe_customer_id || null;
  } catch {
    customerId = null;
  }
  if (!customerId) {
    return res.status(400).json({ error: 'No subscription found for this account.' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[stripe] create portal session failed:', err?.message || err);
    return res.status(502).json({ error: 'Could not open the subscription portal.' });
  }
}

// ─── POST /api/stripe/webhook ────────────────────────────────────────────────
// Must receive the RAW body (mounted with express.raw before express.json).
export async function handleWebhook(req, res) {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  if (!stripe || !supabase || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook not configured.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer
      req.headers['stripe-signature'],
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message}`);
  }

  try {
    switch (event.type) {
      // ── Subscription started / first payment succeeded → grant access ──────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const paid = session.payment_status === 'paid' || session.status === 'complete';
        if (userId && paid) {
          await supabase
            .from('profiles')
            .update({
              has_paid: true,
              stripe_customer_id: session.customer || null,
              stripe_subscription_id: session.subscription || null,
            })
            .eq('id', userId);
          await supabase.from('payments').insert({
            user_id: userId,
            stripe_session: session.id,
            amount_cents: session.amount_total ?? PRICE_CENTS,
            currency: session.currency || CURRENCY,
            status: session.payment_status,
          });
          console.log(`[stripe] user ${userId} subscribed → has_paid=true`);
        }
        break;
      }

      // ── Subscription cancelled or ended → revoke access ───────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await revokeBySubscription(supabase, sub);
        break;
      }

      // ── Renewal payment failed after retries → revoke (Stripe eventually ──
      //    cancels, but we cut access on the terminal failure too) ───────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        // Only revoke once Stripe has exhausted retries for this invoice.
        if (invoice.next_payment_attempt == null) {
          await revokeByCustomer(supabase, invoice.customer);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[stripe] webhook handler failed:', err?.message || err);
    // 500 → Stripe retries the webhook, so this is self-healing.
    return res.status(500).send('Handler failed');
  }

  return res.status(200).json({ received: true });
}

// Revoke access for the user tied to a subscription. Prefer the user_id we
// stamped in metadata; fall back to the Stripe customer id.
async function revokeBySubscription(supabase, sub) {
  const userId = sub?.metadata?.user_id;
  if (userId) {
    await supabase.from('profiles').update({ has_paid: false }).eq('id', userId);
    console.log(`[stripe] user ${userId} subscription ended → has_paid=false`);
    return;
  }
  await revokeByCustomer(supabase, sub?.customer);
}

async function revokeByCustomer(supabase, customerId) {
  if (!customerId) return;
  await supabase.from('profiles').update({ has_paid: false }).eq('stripe_customer_id', customerId);
  console.log(`[stripe] customer ${customerId} → has_paid=false`);
}
