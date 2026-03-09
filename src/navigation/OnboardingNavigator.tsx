import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import NationalityScreen from '../screens/onboarding/NationalityScreen';
import SituationScreen from '../screens/onboarding/SituationScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Welcome"     component={WelcomeScreen} />
      <Stack.Screen name="Nationality" component={NationalityScreen} />
      <Stack.Screen name="Situation"   component={SituationScreen} />
    </Stack.Navigator>
  );
}
