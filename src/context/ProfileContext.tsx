import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, AppLanguage, UserSituation } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

const STORAGE_KEY = '@boussole_profile';
// Cache the paid status per user so returning subscribers enter instantly
// (no splash/hang while we re-verify) — the server value still wins once it
// arrives. Keyed by user id to support multiple accounts on one device.
const PAID_CACHE_PREFIX = '@boussole_haspaid:';

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  markGuideCompleted: (guideId: string) => Promise<void>;
  toggleSavedGuide: (guideId: string) => Promise<void>;
  setCity: (cityId: string, cityName?: string) => Promise<void>;
  resetProfile: () => Promise<void>;
  /**
   * Web paywall: whether the signed-in user has an active subscription.
   * `null` = not determined yet (still loading) — callers must treat this as
   * "unknown", NOT as "unpaid", to avoid flashing the paywall before we know.
   */
  hasPaid: boolean | null;
  /** Re-query has_paid from Supabase (e.g. after returning from Stripe). */
  refreshPaymentStatus: () => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

// ── DB row ⇆ local UserProfile mapping ─────────────────────────────────────
// Supabase column names use snake_case, our TS type uses camelCase.
interface DbProfileRow {
  id: string;
  nationality: string | null;
  situation: UserSituation | null;
  city_id: string | null;
  language: AppLanguage;
  onboarding_done: boolean;
  created_at: string;
}

function rowToProfile(row: DbProfileRow, completedGuides: string[], savedGuides: string[]): UserProfile | null {
  if (!row.nationality || !row.situation) return null;
  const p: UserProfile = {
    id: row.id,
    nationality: row.nationality,
    situation: row.situation,
    language: row.language,
    completedGuides,
    savedGuides,
    createdAt: row.created_at,
  };
  // city_id is stored as "INSEE|Display Name" so the commune name survives
  // across devices without an extra DB column. Split it back apart.
  if (row.city_id) {
    const sep = row.city_id.indexOf('|');
    if (sep > 0) {
      p.cityId = row.city_id.slice(0, sep);
      p.cityName = row.city_id.slice(sep + 1);
    } else {
      p.cityId = row.city_id;
    }
  }
  return p;
}

// Whitelists mirror DB CHECK constraints so we fail fast client-side.
const ALLOWED_LANGS = new Set<AppLanguage>(['fr', 'en', 'pt', 'es', 'ar']);
const ALLOWED_SITUATIONS = new Set<UserSituation>([
  'new_arrival', 'resident', 'student', 'worker', 'refugee', 'family', 'other',
]);
const NATIONALITY_RE = /^[A-Z]{2,5}$/; // ISO 2-3 + 'OTHER'

function buildSafePatch(updates: Partial<UserProfile>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  if (updates.nationality !== undefined && NATIONALITY_RE.test(updates.nationality)) {
    safe.nationality = updates.nationality;
  }
  if (updates.situation !== undefined && ALLOWED_SITUATIONS.has(updates.situation)) {
    safe.situation = updates.situation;
  }
  if (updates.language !== undefined && ALLOWED_LANGS.has(updates.language)) {
    safe.language = updates.language;
  }
  if (updates.cityId !== undefined) {
    // Persist as "INSEE|Name" (≤60 chars) so the name round-trips.
    if (!updates.cityId) {
      safe.city_id = null;
    } else {
      const name = (updates.cityName || '').slice(0, 50);
      safe.city_id = name ? `${updates.cityId}|${name}` : updates.cityId;
    }
  }
  return safe;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // null = payment status not yet determined (see ProfileContextType.hasPaid).
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const configured = isSupabaseConfigured();

  // ── Payment status (web paywall) ───────────────────────────────────────────
  // Tracked independently of `profile`, because payment happens BEFORE
  // onboarding — at that point the profile row is still incomplete (null).
  const refreshPaymentStatus = useCallback(async (): Promise<boolean> => {
    const sess = sessionRef.current;
    if (!configured || !sess) {
      setHasPaid(false);
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', sess.user.id)
        .maybeSingle();
      if (error) {
        // On a transient error, don't downgrade a known-paid state; but if we
        // never determined it, settle on false so the UI can't hang on splash.
        setHasPaid(prev => (prev === null ? false : prev));
        return false;
      }
      const paid = !!data?.has_paid;
      setHasPaid(paid);
      try { await AsyncStorage.setItem(PAID_CACHE_PREFIX + sess.user.id, paid ? '1' : '0'); } catch { /* ignore */ }
      return paid;
    } catch {
      setHasPaid(prev => (prev === null ? false : prev));
      return false;
    }
  }, [configured]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Safety net: never block the UI on the splash. If anything below stalls
    // (SecureStore read, Supabase unreachable in a standalone build), show the
    // app after 8s regardless — the user can still browse guides offline.
    const failSafe = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 6000);

    async function boot() {
      try {
        if (!configured) {
          // Fallback: AsyncStorage-only mode (dev / offline)
          await loadLocal();
          return;
        }

        const { data } = await supabase.auth.getSession();
        sessionRef.current = data.session;
        if (data.session) {
          // Seed hasPaid from the local cache FIRST, so the navigator never
          // hangs on "unknown" (null) for a returning subscriber even if the
          // failsafe timer fires or the network is slow. The re-check below
          // then confirms/corrects it against the server.
          try {
            const cached = await AsyncStorage.getItem(PAID_CACHE_PREFIX + data.session.user.id);
            if (cached === '1') setHasPaid(true);
            else if (cached === '0') setHasPaid(false);
          } catch { /* ignore */ }
          await Promise.all([
            loadRemote(data.session.user.id),
            refreshPaymentStatus(),
          ]);
        } else {
          // Not signed in → no profile (Auth flow will handle it)
          setProfileState(null);
        }
      } catch (e) {
        if (__DEV__) console.warn('[profile] boot failed, falling back to local:', (e as Error)?.message);
        // Last-resort: try the local cache so the app still works
        try { await loadLocal(); } catch { /* ignore */ }
      } finally {
        if (mounted) {
          clearTimeout(failSafe);
          setIsLoading(false);
        }
      }
    }

    boot();

    // Subscribe to auth changes
    if (configured) {
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        sessionRef.current = newSession;
        if (event === 'SIGNED_OUT' || !newSession) {
          setProfileState(null);
          setHasPaid(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Re-sync in the background. Do NOT blank hasPaid here: TOKEN_REFRESHED
          // fires when the tab regains focus, and blanking would drop the whole
          // app back to the splash — and hang there if this refetch stalls on a
          // socket that went stale while the tab was backgrounded. hasPaid is
          // already null after SIGNED_OUT, so a fresh login still shows the
          // splash (not the paywall) until the check resolves.
          await Promise.all([loadRemote(newSession.user.id), refreshPaymentStatus()]);
        }
      });
      return () => {
        mounted = false;
        clearTimeout(failSafe);
        sub.subscription.unsubscribe();
      };
    }

    return () => { mounted = false; clearTimeout(failSafe); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Local cache ──────────────────────────────────────────────────────────
  const loadLocal = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setProfileState(JSON.parse(stored));
    } catch (e) {
      console.error('[profile] local load failed', e);
    }
  }, []);

  const saveLocal = useCallback(async (p: UserProfile | null) => {
    try {
      if (p) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('[profile] local save failed', e);
    }
  }, []);

  // ── Remote (Supabase) fetch ──────────────────────────────────────────────
  const loadRemote = useCallback(async (userId: string) => {
    // 1. Read profile row
    const { data: row, error: rowErr } = await supabase
      .from('profiles')
      .select('id, nationality, situation, city_id, language, onboarding_done, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (rowErr) {
      console.error('[profile] remote load failed', rowErr.message);
      // Try local cache as fallback
      await loadLocal();
      return;
    }
    if (!row) {
      // Brand-new account, no row yet (or trigger pending). Try local cache to migrate.
      await loadLocal();
      return;
    }

    // 2. Read completed_guides + favorites in parallel
    const [{ data: guidesData }, { data: favsData }] = await Promise.all([
      supabase.from('completed_guides').select('guide_id').eq('user_id', userId),
      supabase.from('favorites').select('guide_id').eq('user_id', userId),
    ]);

    const completedGuides = (guidesData ?? []).map((g: { guide_id: string }) => g.guide_id);
    const savedGuides = (favsData ?? []).map((g: { guide_id: string }) => g.guide_id);
    const p = rowToProfile(row as DbProfileRow, completedGuides, savedGuides);

    if (p) {
      setProfileState(p);
      await saveLocal(p);
      return;
    }

    // Profile row exists but is incomplete (nationality/situation null). Before
    // forcing onboarding again, check the local cache: if we already have a
    // complete profile for this user, a previous server save must have failed —
    // re-sync it to Supabase instead of making the user redo onboarding.
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const local = stored ? (JSON.parse(stored) as UserProfile) : null;
      if (local && local.id === userId && local.nationality && local.situation) {
        setProfileState(local);
        const safe = buildSafePatch(local);
        safe.onboarding_done = true;
        const { error: reSyncErr } = await supabase.from('profiles').update(safe).eq('id', userId);
        if (reSyncErr) console.error('[profile] re-sync failed', reSyncErr.message);
        return;
      }
    } catch (e) {
      console.error('[profile] re-sync check failed', (e as Error)?.message);
    }

    // Genuinely new / incomplete → onboarding pending
    setProfileState(null);
  }, [loadLocal, saveLocal]);

  // ── Public API ───────────────────────────────────────────────────────────
  const setProfile = useCallback(async (newProfile: UserProfile) => {
    // Local cache first (fast UI update + offline)
    setProfileState(newProfile);
    await saveLocal(newProfile);

    // If signed in, sync to Supabase
    const sess = sessionRef.current;
    if (configured && sess) {
      const safe = buildSafePatch(newProfile);
      safe.onboarding_done = true;
      const { error: err } = await supabase
        .from('profiles')
        .update(safe)
        .eq('id', sess.user.id);
      if (err) console.error('[profile] remote update failed', err.message);
    }
  }, [configured, saveLocal]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await setProfile(updated);
  }, [profile, setProfile]);

  const markGuideCompleted = useCallback(async (guideId: string) => {
    if (!profile) return;
    if (typeof guideId !== 'string' || guideId.length === 0 || guideId.length > 80) return;
    if (profile.completedGuides.includes(guideId)) return;

    const updated = { ...profile, completedGuides: [...profile.completedGuides, guideId] };
    setProfileState(updated);
    await saveLocal(updated);

    const sess = sessionRef.current;
    if (configured && sess) {
      const { error } = await supabase
        .from('completed_guides')
        .upsert({ user_id: sess.user.id, guide_id: guideId }, { onConflict: 'user_id,guide_id' });
      if (error) console.error('[profile] complete guide sync failed', error.message);
    }
  }, [profile, configured, saveLocal]);

  const toggleSavedGuide = useCallback(async (guideId: string) => {
    if (!profile) return;
    if (typeof guideId !== 'string' || guideId.length === 0 || guideId.length > 80) return;

    const isSaved = profile.savedGuides.includes(guideId);
    const saved = isSaved
      ? profile.savedGuides.filter(id => id !== guideId)
      : [...profile.savedGuides, guideId];
    const updated = { ...profile, savedGuides: saved };
    setProfileState(updated);
    await saveLocal(updated);

    const sess = sessionRef.current;
    if (configured && sess) {
      if (isSaved) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', sess.user.id)
          .eq('guide_id', guideId);
        if (error) console.error('[profile] favorite remove failed', error.message);
      } else {
        const { error } = await supabase
          .from('favorites')
          .upsert({ user_id: sess.user.id, guide_id: guideId }, { onConflict: 'user_id,guide_id' });
        if (error) console.error('[profile] favorite add failed', error.message);
      }
    }
  }, [profile, configured, saveLocal]);

  const setCity = useCallback(async (cityId: string, cityName?: string) => {
    if (!profile) return;
    const updated = { ...profile };
    if (cityId) {
      updated.cityId = cityId;
      if (cityName) updated.cityName = cityName;
      else delete updated.cityName;
    } else {
      delete updated.cityId;
      delete updated.cityName;
    }
    await setProfile(updated);
  }, [profile, setProfile]);

  const resetProfile = useCallback(async () => {
    setProfileState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    // Note: we do NOT sign the user out here — that's a separate action.
    // To wipe the profile on the server, we'd need an Edge Function (RGPD).
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        hasCompletedOnboarding: !!profile,
        setProfile,
        updateProfile,
        markGuideCompleted,
        toggleSavedGuide,
        setCity,
        resetProfile,
        hasPaid,
        refreshPaymentStatus,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
