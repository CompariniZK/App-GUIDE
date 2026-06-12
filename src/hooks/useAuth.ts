/**
 * useAuth — auth state + helpers backed by Supabase.
 *
 * Security:
 *  - Validates email format and password strength CLIENT-side as UX,
 *    but Supabase enforces server-side rules as the source of truth.
 *  - Errors are returned as opaque codes — no raw provider strings leak to UI.
 *  - Session is auto-refreshed by the client; we just subscribe to changes.
 */

import { useEffect, useState, useCallback } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// ── Validation ────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 10; // matches Supabase setting; do not lower without updating dashboard.

export type AuthErrorCode =
  | 'invalid_email'
  | 'weak_password'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'rate_limited'
  | 'not_configured'
  | 'network'
  | 'unknown';

function mapError(err: AuthError | Error | null | undefined): AuthErrorCode {
  if (!err) return 'unknown';
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('email not confirmed')) return 'email_not_confirmed';
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) return 'invalid_credentials';
  if (msg.includes('already registered') || msg.includes('already exists')) return 'user_already_exists';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'rate_limited';
  if (msg.includes('network') || msg.includes('fetch')) return 'network';
  if (msg.includes('password')) return 'weak_password';
  return 'unknown';
}

function validateEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email.trim());
}

function validatePassword(password: string): boolean {
  if (typeof password !== 'string') return false;
  if (password.length < MIN_PASSWORD || password.length > 200) return false;
  // Require at least one letter and one digit (basic complexity; Supabase HIBP check adds breach detection)
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

// ── Hook ───────────────────────────────────────────────────────────────────
export interface UseAuthResult {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; error?: AuthErrorCode }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: AuthErrorCode }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: AuthErrorCode }>;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Initial session read
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes (login, logout, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!configured) return { ok: false, error: 'not_configured' as const };
      if (!validateEmail(email)) return { ok: false, error: 'invalid_email' as const };
      if (!validatePassword(password)) return { ok: false, error: 'weak_password' as const };

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, error: mapError(error) };
      return { ok: true };
    },
    [configured]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) return { ok: false, error: 'not_configured' as const };
      if (!validateEmail(email)) return { ok: false, error: 'invalid_email' as const };
      if (!validatePassword(password)) return { ok: false, error: 'invalid_credentials' as const };

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, error: mapError(error) };
      return { ok: true };
    },
    [configured]
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    await supabase.auth.signOut();
  }, [configured]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!configured) return { ok: false, error: 'not_configured' as const };
      if (!validateEmail(email)) return { ok: false, error: 'invalid_email' as const };

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) return { ok: false, error: mapError(error) };
      return { ok: true };
    },
    [configured]
  );

  return {
    session,
    user: session?.user ?? null,
    loading,
    configured,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
