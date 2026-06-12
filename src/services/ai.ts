/**
 * Boussole AI client — talks to our backend, NOT Groq directly.
 *
 * Why this matters:
 *  - The Groq API key stays server-side (no `EXPO_PUBLIC_GROQ_API_KEY` shipped).
 *  - Users behind VPNs / flagged IPs still get answers (request originates from
 *    the backend's IP, not the user's device).
 *  - Rate limiting + abuse handling happen in one place.
 *  - The (large) French legal base + system prompt are not bundled into the
 *    mobile app — saves bundle size and keeps the prompt opaque.
 *
 * Hardening kept on the client side as defense in depth:
 *  - Validate/cap user input before sending
 *  - Cap conversation history
 *  - Return opaque error codes (no raw upstream text echoed to UI)
 */

import { ChatMessage, UserProfile } from '../types';
import { API_BASE_URL } from '../constants/api';

// ─── Limits (mirror the backend caps — backend re-enforces) ──────────────────
const MAX_USER_MESSAGE_LEN = 1000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_LEN = 2000;

const ALLOWED_LANGS = new Set(['fr', 'en', 'pt', 'es', 'ar']);

// Endpoint
const GROQ_CHAT_URL = `${API_BASE_URL}/api/groq/chat`;

/**
 * Send a chat message to the Boussole backend and return the assistant reply.
 *
 * @throws Error with one of these `.message` codes:
 *   - EMPTY_INPUT, INVALID_INPUT
 *   - NETWORK_ERROR (couldn't reach the backend at all)
 *   - API_NOT_CONFIGURED (backend says it has no GROQ_API_KEY)
 *   - RATE_LIMITED
 *   - API_ERROR_<status> (backend returned a non-2xx we don't know how to handle)
 *   - INVALID_RESPONSE, EMPTY_RESPONSE
 */
export async function callBoussoleAI(
  userMessage: string,
  history: ChatMessage[],
  profile?: UserProfile | null,
): Promise<string> {
  // ─── Input validation ────────────────────────────────────────────────────
  if (typeof userMessage !== 'string') {
    throw new Error('INVALID_INPUT');
  }
  const trimmed = userMessage.trim();
  if (!trimmed) {
    throw new Error('EMPTY_INPUT');
  }
  const safeUserMessage = trimmed.slice(0, MAX_USER_MESSAGE_LEN);

  // History: keep only the last N, cap each message length, strip loading/placeholder messages
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter(m => m && !m.isLoading && m.id !== '0' && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content.slice(0, MAX_HISTORY_MESSAGE_LEN),
    }));

  // Profile: pass only the fields the backend needs (no PII beyond profile shape)
  const safeProfile: { nationality?: string; situation?: string; language?: string } = {};
  if (profile) {
    if (typeof profile.nationality === 'string') safeProfile.nationality = profile.nationality;
    if (typeof profile.situation === 'string') safeProfile.situation = profile.situation;
    if (typeof profile.language === 'string' && ALLOWED_LANGS.has(profile.language)) {
      safeProfile.language = profile.language;
    }
  }

  // ─── Call backend (with one transparent retry on NETWORK_ERROR) ──────────
  // The backend reloads on file save in dev (`node --watch`), which produces a
  // brief connection refusal. One quick retry hides that from the user.
  const payload = JSON.stringify({
    message: safeUserMessage,
    history: safeHistory,
    profile: safeProfile,
  });

  const doFetch = () =>
    fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: payload,
    });

  let response: Response;
  try {
    response = await doFetch();
  } catch (firstErr: any) {
    if (__DEV__) {
      console.warn('[ai] network error (1st try):', firstErr?.name || 'unknown');
    }
    // Wait 2s and retry once
    await new Promise(r => setTimeout(r, 2000));
    try {
      response = await doFetch();
    } catch (secondErr: any) {
      if (__DEV__) {
        console.warn('[ai] network error (retry):', secondErr?.name || 'unknown');
      }
      throw new Error('NETWORK_ERROR');
    }
  }

  if (!response.ok) {
    if (__DEV__) {
      let bodyText = '';
      try { bodyText = await response.clone().text(); } catch { /* ignore */ }
      console.warn('[ai] backend error', response.status, bodyText.slice(0, 200));
    }
    if (response.status === 503) throw new Error('API_NOT_CONFIGURED');
    if (response.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`API_ERROR_${response.status}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('INVALID_RESPONSE');
  }

  const text = data?.reply;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('EMPTY_RESPONSE');
  }

  return text;
}
