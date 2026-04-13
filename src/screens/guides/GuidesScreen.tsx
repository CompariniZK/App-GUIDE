import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GUIDES, GUIDE_CATEGORIES } from '../../constants/guides';
import { Colors } from '../../constants/colors';
import { Guide, GuideCategory } from '../../types';
import { useProfile } from '../../context/ProfileContext';
import { useTranslation } from '../../i18n';

const CATEGORY_COLORS: Record<GuideCategory, string> = {
  documents: Colors.catDocuments,
  health:    Colors.catHealth,
  housing:   Colors.catHousing,
  work:      Colors.catWork,
  family:    Colors.catFamily,
  finance:   Colors.catFinance,
  transport: Colors.catTransport,
  education: Colors.catEducation,
};

export default function GuidesScreen() {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { profile } = useProfile();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const filtered = GUIDES.filter(g => {
    const matchCat = selectedCat === 'all' || g.category === selectedCat;
    const title = t(`guide.${g.id}.title`);
    const subtitle = t(`guide.${g.id}.subtitle`);
    const matchSearch = title.toLowerCase().includes(search.toLowerCase())
      || subtitle.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ─── HEADER (azul) ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('guides.title')}</Text>
        <Text style={styles.headerSub}>{t('guides.count', { count: GUIDES.length })}</Text>
      </View>

      {/* ─── SEARCH BAR (ainda na zona azul) ─────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('guides.search')}
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── CONTEÚDO (branco, canto superior arredondado) ───────────── */}
      <View style={styles.contentWrap}>

        {/* Category chips */}
        <FlatList
          horizontal
          data={[{ id: 'all', emoji: '📋' }, ...GUIDE_CATEGORIES]}
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCat === item.id && styles.catChipActive]}
              onPress={() => setSelectedCat(item.id)}
            >
              <Text style={styles.catEmoji}>{item.emoji}</Text>
              <Text style={[styles.catLabel, selectedCat === item.id && styles.catLabelActive]}>
                {item.id === 'all' ? t('guides.filterAll') : t(`category.${item.id}`)}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={<View style={{ width: 20 }} />}
        />

        {/* Guide list */}
        <FlatList
          data={filtered}
          keyExtractor={g => g.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>{t('guides.empty')}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('GuideDetail', { guideId: item.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.cardLeft, { backgroundColor: CATEGORY_COLORS[item.category] + '22' }]}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{t(`guide.${item.id}.title`)}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{t(`guide.${item.id}.subtitle`)}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.cardTime}>{t(`guide.${item.id}.time`)}</Text>
                  <Text style={styles.cardDot}>·</Text>
                  <Text style={styles.cardSteps}>{t('guideDetail.steps', { count: item.steps.length })}</Text>
                </View>
              </View>
              {profile?.completedGuides.includes(item.id) ? (
                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // ── Search ──────────────────────────────────────────────────────────────────
  searchWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  // ── Content wrap (branco, canto superior arredondado) ────────────────────────
  contentWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    paddingTop: 6,
  },

  // ── Category chips ──────────────────────────────────────────────────────────
  catList: { paddingLeft: 20, paddingRight: 20, paddingVertical: 10 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catLabelActive: { color: Colors.white },

  // ── Guide list ──────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardLeft: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTime: { fontSize: 11, color: Colors.textMuted },
  cardDot: { fontSize: 11, color: Colors.textMuted },
  cardSteps: { fontSize: 11, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
