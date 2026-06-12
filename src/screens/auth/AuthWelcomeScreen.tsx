import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useTranslation } from '../../i18n';
import type { AuthStackParamList } from '../../types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'AuthWelcome'> };

const FEATURE_ICONS = [
  'document-text-outline',
  'chatbubble-ellipses-outline',
  'globe-outline',
];

const FEATURE_KEYS = [
  'welcome.feature.guides',
  'welcome.feature.ai',
  'welcome.feature.multilingual',
];

export default function AuthWelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="compass" size={56} color={Colors.accent} />
          </View>
          <Text style={styles.appName}>Boussole</Text>
          <Text style={styles.tagline} numberOfLines={2}>{t('welcome.tagline')}</Text>
          <Text style={styles.subtitle} numberOfLines={3}>{t('welcome.subtitle')}</Text>
        </View>

        <View style={styles.features}>
          {FEATURE_KEYS.map((key, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={FEATURE_ICONS[i] as any} size={22} color={Colors.accent} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle} numberOfLines={1}>{t(`${key}.title`)}</Text>
                <Text style={styles.featureDesc} numberOfLines={2}>{t(`${key}.desc`)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText} numberOfLines={1}>{t('auth.welcome.createAccount')}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText} numberOfLines={1}>{t('auth.welcome.haveAccount')}</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer} numberOfLines={2}>{t('auth.welcome.disclaimer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 24 },
  hero: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 24,
  },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 34, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  tagline: {
    fontSize: 15, color: Colors.accent, fontWeight: '600',
    marginTop: 4, marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 8,
  },
  features: { paddingHorizontal: 24, paddingVertical: 16, gap: 10 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12, gap: 12,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1, minWidth: 0 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 10 },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
  },
  btnPrimaryText: { color: Colors.primary, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  btnSecondary: {
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  btnSecondaryText: { color: Colors.white, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  disclaimer: {
    fontSize: 11, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', marginTop: 4, paddingHorizontal: 8,
  },
});
