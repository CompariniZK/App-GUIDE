/**
 * useProfile — fetch + update the current user's profile row.
 *
 * Reads/writes from public.profiles. RLS enforces auth.uid() = id,
 * so even if a bug allowed a request for another id, the DB rejects it.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string | null;
  nationality: string | null;
  situation: string | null;
  city_id: string | null;
  language: 'fr' | 'en' | 'pt' | 'es' | 'ar';
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

// Whitelists mirror the DB CHECK constraints so we fail fast in the client.
const ALLOWED_LANGS = new Set(['fr', 'en', 'pt', 'es', 'ar']);
const ALLOWED_SITUATIONS = new Set([
  'student', 'worker', 'asylum-seeker', 'refugee', 'family',
  'resident', 'tourist', 'entrepreneur', 'retired', 'other',
]);
const NATIONALITY_RE = /^[A-Z]{2,3}$/;

function sanitizeUpdate(patch: Partial<Profile>): Partial<Profile> {
  const safe: Partial<Profile> = {};

  if (patch.full_name !== undefined) {
    if (typeof patch.full_name === 'string' && patch.full_name.length <= 120) {
      safe.full_name = patch.full_name.trim();
    }
  }
  if (patch.nationality !== undefined) {
    if (typeof patch.nationality === 'string' && NATIONALITY_RE.test(patch.nationality)) {
      safe.nationality = patch.nationality;
    }
  }
  if (patch.situation !== undefined) {
    if (typeof patch.situation === 'string' && ALLOWED_SITUATIONS.has(patch.situation)) {
      safe.situation = patch.situation;
    }
  }
  if (patch.city_id !== undefined) {
    if (typeof patch.city_id === 'string' && patch.city_id.length <= 60) {
      safe.city_id = patch.city_id;
    }
  }
  if (patch.language !== undefined) {
    if (typeof patch.language === 'string' && ALLOWED_LANGS.has(patch.language)) {
      safe.language = patch.language as Profile['language'];
    }
  }
  if (patch.onboarding_done !== undefined) {
    safe.onboarding_done = Boolean(patch.onboarding_done);
  }
  return safe;
}

export interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<{ ok: boolean; error?: string }>;
}

export function useProfile(user: User | null): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (err) {
      setError('fetch_failed');
      setProfile(null);
    } else {
      setProfile((data as Profile) ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return { ok: false, error: 'not_authenticated' };
      const safe = sanitizeUpdate(patch);
      if (Object.keys(safe).length === 0) return { ok: false, error: 'nothing_to_update' };

      const { data, error: err } = await supabase
        .from('profiles')
        .update(safe)
        .eq('id', user.id)
        .select()
        .maybeSingle();
      if (err) return { ok: false, error: 'update_failed' };
      if (data) setProfile(data as Profile);
      return { ok: true };
    },
    [user]
  );

  return { profile, loading, error, refresh: fetchProfile, update };
}
