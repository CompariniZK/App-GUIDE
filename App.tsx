import 'react-native-gesture-handler';
import React from 'react';
import { ProfileProvider } from './src/context/ProfileContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ProfileProvider>
      <AppNavigator />
    </ProfileProvider>
  );
}
