import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ProfileProvider } from './src/context/ProfileContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/colors';

const IS_WEB = Platform.OS === 'web';

// Below this width we treat the browser as a phone and drop the desktop frame.
const PHONE_MAX_WIDTH = 600;

// iOS Safari resizes its toolbars while you scroll, but `height: 100%` (what the
// Expo web reset uses) resolves against the *large* viewport — as if the toolbar
// were hidden. The layout ends up taller than what's actually visible, so either
// the header or the bottom tab bar gets clipped. `100dvh` follows the toolbar,
// which fixes both. We also stop any accidental sideways scrolling.
const WEB_VIEWPORT_CSS = `
  html, body, #root { overflow-x: hidden; }
  @supports (height: 100dvh) {
    html, body, #root { height: 100dvh; }
  }
`;

function useWebViewportFix() {
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    const id = 'boussole-viewport-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = WEB_VIEWPORT_CSS;
    // Appended last so it wins over Expo's own reset.
    document.head.appendChild(style);
  }, []);
}

export default function App() {
  // Preload the icon font so the first paint doesn't show empty "tofu" boxes
  // where Ionicons should be (the vector font loads asynchronously on web).
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useWebViewportFix();
  const { width } = useWindowDimensions();

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
  // branded backdrop, so a wide screen reads as intentional.
  //
  // On a real phone the frame is pure harm: its max width/height, rounded
  // corners and `overflow: hidden` crop the edges of the UI. So we render the
  // app full-bleed there instead.
  if (IS_WEB && width > PHONE_MAX_WIDTH) {
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
