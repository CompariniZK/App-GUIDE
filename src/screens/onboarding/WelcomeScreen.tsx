import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'> };

const FEATURES = [
  { icon: 'document-text-outline', title: 'Guias officiels',    desc: 'Étapes claires pour chaque démarche administrative' },
  { icon: 'chatbubble-ellipses-outline', title: 'IA Juridique', desc: 'Posez vos questions, obtenez des réponses basées sur les lois françaises' },
  { icon: 'globe-outline', title: 'Multilingue',                desc: 'Français, Anglais, Portugais, Espagnol et Arabe' },
];

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Logo area */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="compass" size={64} color={Colors.accent} />
        </View>
        <Text style={styles.appName}>Boussole</Text>
        <Text style={styles.tagline}>Votre guide en France</Text>
        <Text style={styles.subtitle}>
          Naviguez la bureaucratie française avec confiance — quelle que soit votre nationalité.
        </Text>
      </View>

      {/* Feature list */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={22} color={Colors.accent} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Nationality')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Commencer</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          100% gratuit · Pas de compte requis pour commencer
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
});
