/**
 * Supabase client — Boussole
 *
 * Security model:
 * - Session tokens stored in expo-secure-store (Keychain on iOS / EncryptedSharedPreferences on Android),
 *   never in AsyncStorage (which is plaintext).
 * - Only the `anon` public key is used here. The `service_role` key MUST stay server-side.
 * - URL + key read from EXPO_PUBLIC_SUPABASE_* env vars. The app refuses to start
 *   if they're missing in production builds.
 * - Auto-refresh and persisted session enabled so users don't have to re-login daily.
 */

import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ── Env validation ─────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (!__DEV__) {
    throw new Error(
      '[supabase] EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in production builds.'
    );
  }
  // In dev we warn but allow the app to boot so screens that don't depend on Supabase still work
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — auth features will not work.'
  );
}

// Sanity check: prevent accidentally using a service_role / secret key in client code.
// Supabase now ships two key formats:
//   • Legacy JWT  — `eyJ...`  → decode payload, check role === 'anon'
//   • New format  — `sb_publishable_...` (safe) or `sb_secret_...` (DANGEROUS)
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const part = jwt.split('.')[1];
    if (!part) return null;
    // base64url -> base64
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    // atob is available in Hermes / modern RN engines
    const json = typeof atob === 'function' ? atob(b64) : null;
    return json ? (JSON.parse(json) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

if (SUPABASE_ANON_KEY) {
  // New format hard checks
  if (SUPABASE_ANON_KEY.startsWith('sb_secret_')) {
    throw new Error(
      '[supabase] Refusing to start: EXPO_PUBLIC_SUPABASE_ANON_KEY is a SECRET key (sb_secret_*). ' +
      'Secret keys must NEVER be shipped in client code. Use the publishable key (sb_publishable_*) instead.'
    );
  }
  if (SUPABASE_ANON_KEY.startsWith('service_role')) {
    throw new Error('[supabase] Refusing to start: service_role key detected in client.');
  }

  // Legacy JWT: decode and check role
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) {
    const payload = decodeJwtPayload(SUPABASE_ANON_KEY);
    if (payload && typeof payload.role === 'string' && payload.role !== 'anon') {
      throw new Error(
        `[supabase] Refusing to start: legacy key has role "${payload.role}", expected "anon".`
      );
    }
  }
  // sb_publishable_* is safe and intentionally has no decodable payload — nothing more to check.
}

// ── Secure storage adapter (with chunking) ───────────────────────────────
// expo-secure-store uses the platform Keychain/Keystore — hardware-backed encryption.
// Caveat: on Android the value size is capped at 2048 bytes. Supabase sessions
// (access JWT + refresh token + user metadata) can exceed that, so we transparently
// chunk the value across multiple SecureStore entries.
const CHUNK_SIZE = 2000;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const lengthStr = await SecureStore.getItemAsync(`${key}_len`);
      if (!lengthStr) {
        // Backward-compat: maybe a non-chunked value was written previously
        return await SecureStore.getItemAsync(key);
      }
      const n = parseInt(lengthStr, 10);
      if (!Number.isFinite(n) || n < 1) return null;

      const chunks = await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`))
      );
      // If any chunk is missing the value is corrupted — wipe and return null
      // so Supabase treats it as "not logged in" rather than crashing on parse.
      if (chunks.some(c => c === null)) {
        await SecureStoreAdapter.removeItem(key);
        return null;
      }
      return chunks.join('');
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // Always clear any previous chunks first to avoid stale data after shrink
    await SecureStoreAdapter.removeItem(key);

    const chunks: string[] = [];
    if (value.length === 0) {
      chunks.push('');
    } else {
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
    }

    await SecureStore.setItemAsync(`${key}_len`, String(chunks.length));
    await Promise.all(
      chunks.map((c, i) => SecureStore.setItemAsync(`${key}_${i}`, c))
    );
  },

  async removeItem(key: string): Promise<void> {
    try {
      // Best-effort cleanup of any legacy non-chunked value
      await SecureStore.deleteItemAsync(key).catch(() => {});

      const lengthStr = await SecureStore.getItemAsync(`${key}_len`);
      if (!lengthStr) return;
      const n = parseInt(lengthStr, 10);
      if (!Number.isFinite(n)) {
        await SecureStore.deleteItemAsync(`${key}_len`).catch(() => {});
        return;
      }
      await Promise.all([
        SecureStore.deleteItemAsync(`${key}_len`),
        ...Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
      ]);
    } catch {
      // Best effort — ignore
    }
  },
};

// ── Client ────────────────────────────────────────────────────────────────
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // React Native — no URL-based auth
      flowType: 'pkce', // PKCE flow is more secure than implicit
    },
    global: {
      headers: {
        'X-Client-Info': 'boussole-mobile',
      },
    },
  }
);

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
