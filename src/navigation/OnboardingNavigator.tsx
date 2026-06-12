import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import NationalityScreen from '../screens/onboarding/NationalityScreen';
import SituationScreen from '../screens/onboarding/SituationScreen';
import CityScreen from '../screens/onboarding/CityScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  // After signup/login the user has already seen AuthWelcome — skip the marketing
  // welcome and jump straight into profile setup.
  return (
    <Stack.Navigator
      initialRouteName="Nationality"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Nationality" component={NationalityScreen} />
      <Stack.Screen name="Situation"   component={SituationScreen} />
      <Stack.Screen name="City"        component={CityScreen} />
      <Stack.Screen name="Welcome"     component={WelcomeScreen} />
    </Stack.Navigator>
  );
}
