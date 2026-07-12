import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, AppLanguage, UserSituation } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

const STORAGE_KEY = '@boussole_profile';

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  markGuideCompleted: (guideId: string) => Promise<void>;
  toggleSavedGuide: (guideId: string) => Promise<void>;
  setCity: (cityId: string) => Promise<void>;
  resetProfile: () => Promise<void>;
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
  if (row.city_id) p.cityId = row.city_id;
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
    safe.city_id = updates.cityId || null;
  }
  return safe;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const configured = isSupabaseConfigured();

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
          await loadRemote(data.session.user.id);
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
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await loadRemote(newSession.user.id);
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

  const setCity = useCallback(async (cityId: string) => {
    if (!profile) return;
    const updated = { ...profile };
    if (cityId) updated.cityId = cityId;
    else delete updated.cityId;
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
