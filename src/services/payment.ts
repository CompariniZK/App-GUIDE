/**
 * payment.ts — kicks off the Stripe Checkout flow for the €1.99 web paywall.
 *
 * Web-only: the backend creates a Stripe Checkout session tied to the logged-in
 * user (via their Supabase access token) and returns a hosted-page URL. We then
 * redirect the browser there. Card data never touches our code.
 */
import { supabase } from './supabase';
import { API_ENDPOINTS } from '../constants/api';

export type CheckoutResult =
  | { ok: true; redirecting: true }
  | { ok: true; alreadyPaid: true }
  | { ok: false; error: string };

/**
 * Starts checkout: asks the backend for a session URL and redirects the browser.
 * Returns an error result instead of throwing so the UI can show a message.
 */
export async function startCheckout(): Promise<CheckoutResult> {
  // 1. Current access token proves who is paying.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { ok: false, error: 'Session expirée. Reconnectez-vous.' };
  }

  // 2. Ask the backend to create the Checkout session.
  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    res = await fetch(API_ENDPOINTS.stripeCheckout, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    return { ok: false, error: 'Connexion au serveur impossible. Réessayez.' };
  }

  if (!res.ok) {
    if (res.status === 503) {
      return { ok: false, error: 'Le paiement n’est pas encore disponible.' };
    }
    return { ok: false, error: 'Impossible de démarrer le paiement.' };
  }

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    alreadyPaid?: boolean;
  };

  if (data.alreadyPaid) {
    return { ok: true, alreadyPaid: true };
  }
  if (!data.url) {
    return { ok: false, error: 'Réponse invalide du serveur.' };
  }

  // 3. Redirect to Stripe's hosted checkout page (web only).
  if (typeof window !== 'undefined') {
    window.location.href = data.url;
    return { ok: true, redirecting: true };
  }
  return { ok: false, error: 'Le paiement est disponible uniquement sur le web.' };
}

/** True when the browser came back from Stripe with ?paid=1. */
export function returnedFromSuccessfulCheckout(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('paid') === '1';
  } catch {
    return false;
  }
}

/** Remove ?paid / ?canceled from the URL without reloading. */
export function clearCheckoutQueryParams(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('paid');
    url.searchParams.delete('canceled');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}
