import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList, UserProfile } from '../../types';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../context/ProfileContext';
import { CITIES } from '../../constants/cities';
import { getLanguageForNationality, useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'City'>;
  route: RouteProp<OnboardingStackParamList, 'City'>;
};

export default function CityScreen({ navigation, route }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const { setProfile } = useProfile();
  const { t } = useTranslation();
  const { nationality, situation } = route.params;

  const handleFinish = async (cityId?: string) => {
    const profile: UserProfile = {
      id: Date.now().toString(),
      nationality,
      situation,
      language: getLanguageForNationality(nationality),
      cityId: cityId ?? undefined,
      completedGuides: [],
      savedGuides: [],
      createdAt: new Date().toISOString(),
    };
    await setProfile(profile);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header com dots */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotComplete]} />
          <View style={[styles.dot, styles.dotComplete]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Título */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>{t('city.title')}</Text>
        <Text style={styles.subtitle}>{t('city.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {/* Cards das cidades disponíveis */}
        {CITIES.map(city => (
          <TouchableOpacity
            key={city.id}
            style={[styles.card, selected === city.id && styles.cardSelected]}
            onPress={() => setSelected(city.id)}
            activeOpacity={0.75}
          >
            <View style={styles.cityIconWrap}>
              <Text style={styles.cityEmoji}>🏙️</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, selected === city.id && styles.cardTitleSelected]}>
                {city.name}
              </Text>
              <Text style={styles.cardDesc}>{city.department}</Text>
              <Text style={styles.cardResources}>
                {t('city.resources', { count: city.resources.length })}
              </Text>
            </View>
            <View style={[styles.radio, selected === city.id && styles.radioSelected]}>
              {selected === city.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Opção "minha cidade não está na lista" */}
        <TouchableOpacity
          style={[styles.card, styles.cardOther, selected === '__other' && styles.cardSelected]}
          onPress={() => setSelected('__other')}
          activeOpacity={0.75}
        >
          <View style={styles.cityIconWrap}>
            <Text style={styles.cityEmoji}>📍</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, selected === '__other' && styles.cardTitleSelected]}>
              {t('city.otherTitle')}
            </Text>
            <Text style={styles.cardDesc}>{t('city.otherDesc')}</Text>
          </View>
          <View style={[styles.radio, selected === '__other' && styles.radioSelected]}>
            {selected === '__other' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnNext, !selected && styles.btnNextDisabled]}
          onPress={() => handleFinish(selected === '__other' ? undefined : selected ?? undefined)}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.btnNextText}>{t('city.cta')}</Text>
          <Ionicons name="compass" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  progress: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primaryLight, width: 20 },
  dotComplete: { backgroundColor: Colors.success, width: 20 },
  titleArea: { paddingHorizontal: 24, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 14,
  },
  cardSelected: { borderColor: Colors.primaryLight, backgroundColor: Colors.selectedBg },
  cardOther: { borderStyle: 'dashed' },
  cityIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(26,35,126,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  cityEmoji: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  cardTitleSelected: { color: Colors.primaryLight },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  cardResources: { fontSize: 11, color: Colors.primaryLight, fontWeight: '600', marginTop: 4 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primaryLight },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primaryLight },
  footer: { paddingHorizontal: 20, paddingVertical: 16 },
  btnNext: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnNextDisabled: { backgroundColor: Colors.border },
  btnNextText: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
});
