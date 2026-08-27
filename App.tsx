import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ProfileProvider } from './src/context/ProfileContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/colors';

const IS_WEB = Platform.OS === 'web';

export default function App() {
  // Preload the icon font so the first paint doesn't show empty "tofu" boxes
  // where Ionicons should be (the vector font loads asynchronously on web).
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  // Safety net: never block the app on font loading. Render after 3s no matter
  // what, even if the font load stalls or errors.
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

  const app = (
    <SafeAreaProvider>
      <ProfileProvider>
        <AppNavigator />
      </ProfileProvider>
    </SafeAreaProvider>
  );

  // On desktop web, the mobile UI would stretch edge-to-edge and look like a
  // phone lying sideways. Instead we center it in a phone-width "frame" on a
  // branded backdrop, so a wide screen reads as intentional. On narrow screens
  // (phones opening the web app) the frame simply fills the viewport.
  if (IS_WEB) {
    return (
      <View style={styles.webBackdrop}>
        <View style={styles.webFrame}>{app}</View>
      </View>
    );
  }

  return app;
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    // Subtle brand gradient behind the frame (web-only CSS, ignored on native).
    // @ts-ignore — react-native-web accepts CSS strings here.
    backgroundImage: `linear-gradient(135deg, ${Colors.primaryDark} 0%, ${Colors.primary} 60%, #1565c0 100%)`,
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    height: '100%',
    // @ts-ignore — web-only: cap the height so the frame looks like a device on
    // very tall desktop windows, and add a card shadow + rounded corners.
    maxHeight: 920,
    alignSelf: 'center',
    backgroundColor: Colors.background,
    overflow: 'hidden',
    // @ts-ignore — web-only style props.
    borderRadius: 20,
    // @ts-ignore
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  },
});
