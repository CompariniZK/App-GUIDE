import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { MainTabParamList, GuidesStackParamList } from '../types';
import { Colors } from '../constants/colors';

import HomeScreen       from '../screens/home/HomeScreen';
import GuidesScreen     from '../screens/guides/GuidesScreen';
import GuideDetailScreen from '../screens/guides/GuideDetailScreen';
import ChatScreen       from '../screens/chat/ChatScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';

const Tab   = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<GuidesStackParamList>();

function GuidesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GuidesList"   component={GuidesScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="GuideDetail"  component={GuideDetailScreen}
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: Colors.white,
        }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home:    'compass',
            Guides:  'book-outline',
            Chat:    'chatbubble-ellipses-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Guides"  component={GuidesStack}   options={{ tabBarLabel: 'Guides' }} />
      <Tab.Screen name="Chat"    component={ChatScreen}    options={{ tabBarLabel: 'IA Chat' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
