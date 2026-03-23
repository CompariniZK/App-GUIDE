import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserSituation, AppLanguage } from '../types';

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

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfileState(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfile = async (newProfile: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    setProfileState(newProfile);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await setProfile(updated);
  };

  const markGuideCompleted = async (guideId: string) => {
    if (!profile) return;
    const completed = [...new Set([...profile.completedGuides, guideId])];
    await updateProfile({ completedGuides: completed });
  };

  const toggleSavedGuide = async (guideId: string) => {
    if (!profile) return;
    const saved = profile.savedGuides.includes(guideId)
      ? profile.savedGuides.filter(id => id !== guideId)
      : [...profile.savedGuides, guideId];
    await updateProfile({ savedGuides: saved });
  };

  const setCity = async (cityId: string) => {
    if (!cityId) {
      // Remove cityId from profile
      const updated = { ...profile! };
      delete updated.cityId;
      await setProfile(updated);
    } else {
      await updateProfile({ cityId });
    }
  };

  const resetProfile = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfileState(null);
  };

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
