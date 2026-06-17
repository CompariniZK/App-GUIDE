import React from 'react';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTabParamList, GuidesStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useTranslation } from '../i18n';

import HomeScreen       from '../screens/home/HomeScreen';
import GuidesScreen     from '../screens/guides/GuidesScreen';
import GuideDetailScreen from '../screens/guides/GuideDetailScreen';
import ChatScreen       from '../screens/chat/ChatScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';

const Tab   = createMaterialTopTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<GuidesStackParamList>();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home:    'compass',
  Guides:  'book-outline',
  Chat:    'chatbubble-ellipses-outline',
  Profile: 'person-outline',
};

const LABEL_KEYS: Record<string, string> = {
  Home:    'tab.home',
  Guides:  'tab.guides',
  Chat:    'tab.chat',
  Profile: 'tab.profile',
};

function GuidesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GuidesList"   component={GuidesScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="GuideDetail"  component={GuideDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/**
 * Custom bottom tab bar — visually identical to the previous BottomTabNavigator,
 * but powered by material-top-tabs (which supports horizontal slide animation
 * and swipe gestures out of the box).
 */
function BottomTabBar({ state, descriptors, navigation, position }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const bottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 8;

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad, height: 56 + bottomPad }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? Colors.primaryLight : Colors.textMuted;
        const iconName = ICONS[route.name];
        const label = t(LABEL_KEYS[route.name] ?? route.name);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tab}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true, radius: 36 }}
          >
            <Ionicons name={iconName} size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
      }}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Guides"  component={GuidesStack} />
      <Tab.Screen name="Chat"    component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
