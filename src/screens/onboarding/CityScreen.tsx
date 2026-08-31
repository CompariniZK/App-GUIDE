import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList, UserProfile } from '../../types';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../context/ProfileContext';
import { searchCommunes, CommuneResult } from '../../services/cities';
import { getLanguageForNationality, useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'City'>;
  route: RouteProp<OnboardingStackParamList, 'City'>;
};

export default function CityScreen({ navigation, route }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommuneResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CommuneResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setProfile } = useProfile();
  const { t } = useTranslation();
  const { nationality, situation } = route.params;
  const reqId = useRef(0);

  // Debounced commune search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const handle = setTimeout(async () => {
      const communes = await searchCommunes(q);
      if (id === reqId.current) {
        setResults(communes);
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const finish = async (city?: CommuneResult) => {
    if (submitting) return;
    setSubmitting(true);
    const profile: UserProfile = {
      id: Date.now().toString(),
      nationality,
      situation,
      language: getLanguageForNationality(nationality),
      cityId: city?.insee,
      cityName: city?.name,
      completedGuides: [],
      savedGuides: [],
      createdAt: new Date().toISOString(),
    };
    await setProfile(profile);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

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

      <View style={styles.titleArea}>
        <Text style={styles.title}>{t('city.title')}</Text>
        <Text style={styles.subtitle}>{t('city.subtitle')}</Text>
      </View>

      {/* Search box */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('city.searchPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={(v) => { setQuery(v); setSelected(null); }}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading && <ActivityIndicator size="small" color={Colors.primaryLight} />}
        {!loading && query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSelected(null); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={results}
        keyExtractor={(item) => item.insee}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim().length >= 2 && !loading ? (
            <Text style={styles.empty}>{t('city.noResults')}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isSel = selected?.insee === item.insee;
          return (
            <TouchableOpacity
              style={[styles.card, isSel && styles.cardSelected]}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={styles.cityIconWrap}>
                <Ionicons name="location" size={20} color={Colors.primaryLight} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, isSel && styles.cardTitleSelected]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={1}>
                  {item.postalCode ? `${item.postalCode} · ` : ''}Dép. {item.department}
                </Text>
              </View>
              <View style={[styles.radio, isSel && styles.radioSelected]}>
                {isSel && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnNext, (!selected || submitting) && styles.btnNextDisabled]}
          onPress={() => finish(selected ?? undefined)}
          disabled={!selected || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.btnNextText}>{t('city.cta')}</Text>
              <Ionicons name="compass" size={18} color={Colors.primary} />
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => finish(undefined)} disabled={submitting} style={styles.skip} hitSlop={8}>
          <Text style={styles.skipText}>{t('city.skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  progress: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primaryLight, width: 20 },
  dotComplete: { backgroundColor: Colors.success, width: 20 },
  titleArea: { paddingHorizontal: 24, marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 0 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingVertical: 8, gap: 10 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 24, fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border, gap: 14,
  },
  cardSelected: { borderColor: Colors.primaryLight, backgroundColor: Colors.selectedBg },
  cityIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(26,35,126,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  cardTitleSelected: { color: Colors.primaryLight },
  cardDesc: { fontSize: 12, color: Colors.textSecondary },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primaryLight },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primaryLight },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 8 },
  btnNext: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  btnNextDisabled: { backgroundColor: Colors.border },
  btnNextText: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
