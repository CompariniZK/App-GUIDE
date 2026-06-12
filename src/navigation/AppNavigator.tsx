import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading: profileLoading, hasCompletedOnboarding } = useProfile();
  const { session, loading: authLoading, configured } = useAuth();

  // Show splash while we figure out the user's state
  if (authLoading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Decide which navigator to mount:
  //  1. Supabase not configured (dev only) → fall back to old behaviour so the app still works
  //  2. Not signed in → AuthNavigator
  //  3. Signed in but onboarding incomplete → OnboardingNavigator
  //  4. Signed in + onboarding done → Main
  let initialRoute: keyof RootStackParamList;
  if (!configured) {
    initialRoute = hasCompletedOnboarding ? 'Main' : 'Onboarding';
  } else if (!session) {
    initialRoute = 'Auth';
  } else if (!hasCompletedOnboarding) {
    initialRoute = 'Onboarding';
  } else {
    initialRoute = 'Main';
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {initialRoute === 'Auth' && (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
        {initialRoute === 'Onboarding' && (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
        {initialRoute === 'Main' && (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
