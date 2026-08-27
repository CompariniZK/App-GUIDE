import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ProfileProvider } from './src/context/ProfileContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/colors';

export default function App() {
  // Preload the icon font so the first paint doesn't show empty "tofu" boxes
  // where Ionicons should be (the vector font loads asynchronously on web).
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  // Safety net: never block the app on font loading. Render after 3s no matter
  // what, even if the font load stalls or errors — icons will pop in when ready.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const ready = fontsLoaded || Boolean(fontError) || timedOut;

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <AppNavigator />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
