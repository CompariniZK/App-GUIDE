import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Platform } from 'react-native';

import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import PaywallScreen from '../screens/paywall/PaywallScreen';
import { Colors } from '../constants/colors';

// The €1.99 paywall is web-only for now: on Android, in-app digital sales must
// go through Google Play Billing, so the Play Store build stays free.
const PAYWALL_ENABLED = Platform.OS === 'web';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading: profileLoading, hasCompletedOnboarding, hasPaid } = useProfile();
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
  //  3. Signed in but hasn't paid (web only) → Paywall
  //  4. Signed in but onboarding incomplete → OnboardingNavigator
  //  5. Signed in + paid + onboarding done → Main
  let initialRoute: keyof RootStackParamList;
  if (!configured) {
    initialRoute = hasCompletedOnboarding ? 'Main' : 'Onboarding';
  } else if (!session) {
    initialRoute = 'Auth';
  } else if (PAYWALL_ENABLED && !hasPaid) {
    initialRoute = 'Paywall';
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
        {initialRoute === 'Paywall' && (
          <Stack.Screen name="Paywall" component={PaywallScreen} />
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
