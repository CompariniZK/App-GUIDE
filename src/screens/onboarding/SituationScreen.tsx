import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList, UserSituation, UserProfile } from '../../types';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../context/ProfileContext';
import { getLanguageForNationality, useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Situation'>;
  route: RouteProp<OnboardingStackParamList, 'Situation'>;
};

const SITUATION_IDS: { id: UserSituation; emoji: string }[] = [
  { id: 'new_arrival', emoji: '✈️' },
  { id: 'resident', emoji: '🏡' },
  { id: 'student', emoji: '🎓' },
  { id: 'worker', emoji: '💼' },
  { id: 'family', emoji: '👨‍👩‍👧' },
  { id: 'refugee', emoji: '🕊️' },
];

export default function SituationScreen({ navigation, route }: Props) {
  const [selected, setSelected] = useState<UserSituation | null>(null);
  const { setProfile } = useProfile();
  const { t } = useTranslation();
  const { nationality } = route.params;

  const handleFinish = async () => {
    if (!selected) return;
    const profile: UserProfile = {
      id: Date.now().toString(),
      nationality,
      situation: selected,
      language: getLanguageForNationality(nationality),
      completedGuides: [],
      savedGuides: [],
      createdAt: new Date().toISOString(),
    };
    await setProfile(profile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotComplete]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>{t('situation.title')}</Text>
        <Text style={styles.subtitle}>{t('situation.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {SITUATION_IDS.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.card, selected === s.id && styles.cardSelected]}
            onPress={() => setSelected(s.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.emoji}>{s.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, selected === s.id && styles.cardTitleSelected]}>
                {t(`situation.${s.id}.title`)}
              </Text>
              <Text style={styles.cardDesc}>{t(`situation.${s.id}.desc`)}</Text>
            </View>
            <View style={[styles.radio, selected === s.id && styles.radioSelected]}>
              {selected === s.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnNext, !selected && styles.btnNextDisabled]}
          onPress={handleFinish}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.btnNextText}>{t('situation.cta')}</Text>
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
  cardSelected: { borderColor: Colors.primaryLight, backgroundColor: '#EEF4FF' },
  emoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  cardTitleSelected: { color: Colors.primaryLight },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
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
