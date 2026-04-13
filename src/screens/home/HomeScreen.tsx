import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/ProfileContext';
import { GUIDES, GUIDE_CATEGORIES } from '../../constants/guides';
import { Colors } from '../../constants/colors';
import { Guide, GuideCategory } from '../../types';
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

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   Colors.success,
  medium: Colors.warning,
  hard:   Colors.error,
};

export default function HomeScreen() {
  const { profile } = useProfile();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  if (!profile) return null;

  const priorityGuides = GUIDES.filter(g =>
    g.relevantFor.includes(profile.situation)
  ).slice(0, 3);

  const [progressOpen, setProgressOpen] = useState(false);

  const myGuides = GUIDES.filter(g => g.relevantFor.includes(profile.situation));
  const completedCount = profile.completedGuides.length;
  const totalCount = myGuides.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount >= totalCount && totalCount > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary}
        translucent={Platform.OS === 'android'} />

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t('home.greeting')}</Text>
          <Text style={styles.headerSub}>{t(`situationLabel.${profile.situation}`)}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ─── CONTENT (white, rounded top) ────────────────────────────── */}
      <View style={styles.scrollWrap}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── PROGRESS ───────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.progressCard}
            onPress={() => setProgressOpen(prev => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>{t('home.progress.title')}</Text>
                <Text style={styles.progressHint}>
                  {allDone
                    ? t('home.progress.done')
                    : completedCount === 0
                      ? t('home.progress.start')
                      : t('home.progress.continue', { remaining: totalCount - completedCount })}
                </Text>
              </View>
              <View style={styles.progressRight}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressNum}>
                    {t('home.progress.count', { completed: completedCount, total: totalCount })}
                  </Text>
                </View>
                <Ionicons
                  name={progressOpen ? 'chevron-up' : 'chevron-down'}
                  size={16} color={Colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBarFill, { width: `${Math.max(progressPct, 3)}%` }]} />
            </View>

            {progressOpen && (
              <View style={styles.progressList}>
                {myGuides.map(g => {
                  const done = profile.completedGuides.includes(g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={styles.progressItem}
                      onPress={() => navigation.navigate('Guides', {
                        screen: 'GuideDetail',
                        params: { guideId: g.id },
                      })}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={done ? Colors.success : Colors.textMuted}
                      />
                      <Text style={[
                        styles.progressItemText,
                        done && styles.progressItemDone,
                      ]}>{t(`guide.${g.id}.title`)}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>

          {/* ── PRIORITY GUIDES ─────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.section.priority')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Guides')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.seeAll}>{t('home.section.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {priorityGuides.map((guide, i) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                index={i}
                isCompleted={profile.completedGuides.includes(guide.id)}
                onPress={() => navigation.navigate('Guides', {
                  screen: 'GuideDetail',
                  params: { guideId: guide.id },
                })}
              />
            ))}
          </View>

          {/* ── AI ASSISTANT ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.85}
          >
            <View style={styles.aiTop}>
              <View style={styles.aiIcon}>
                <Ionicons name="chatbubble-ellipses" size={24} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>{t('home.ai.title')}</Text>
                <Text style={styles.aiDesc}>{t('home.ai.desc')}</Text>
              </View>
            </View>
            <View style={styles.aiCta}>
              <Text style={styles.aiCtaText}>{t('home.ai.cta')}</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          {/* ── QUICK ACTIONS ───────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.section.quickActions')}</Text>
            <View style={styles.quickGrid}>
              {GUIDE_CATEGORIES.slice(0, 4).map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.quickCard}
                  onPress={() => navigation.navigate('Guides')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: CATEGORY_COLORS[cat.id as GuideCategory] + '14' }]}>
                    <Text style={styles.quickEmoji}>{cat.emoji}</Text>
                  </View>
                  <Text style={styles.quickLabel}>{t(`category.${cat.id}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ─── GUIDE CARD ──────────────────────────────────────────────────────────── */

function GuideCard({ guide, index, isCompleted, onPress }: {
  guide: Guide;
  index: number;
  isCompleted: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const catColor = CATEGORY_COLORS[guide.category];
  return (
    <TouchableOpacity style={styles.guideCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.guideNumBadge, { backgroundColor: catColor }]}>
        <Text style={styles.guideNumText}>{index + 1}</Text>
      </View>
      <View style={styles.guideBody}>
        <View style={styles.guideRow1}>
          <Text style={styles.guideTitle} numberOfLines={1}>{t(`guide.${guide.id}.title`)}</Text>
          {isCompleted && (
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          )}
        </View>
        <Text style={styles.guideSub} numberOfLines={1}>{t(`guide.${guide.id}.subtitle`)}</Text>
        <View style={styles.guideFooter}>
          <View style={styles.guideTag}>
            <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.guideTagText}>{t(`guide.${guide.id}.time`)}</Text>
          </View>
          <View style={[styles.guideTag, { backgroundColor: DIFFICULTY_COLOR[guide.difficulty] + '18' }]}>
            <Text style={[styles.guideTagText, { color: DIFFICULTY_COLOR[guide.difficulty] }]}>
              {t(`difficulty.${guide.difficulty}`)}
            </Text>
          </View>
          <View style={styles.guideTag}>
            <Text style={styles.guideTagText}>{t('home.steps', { count: guide.steps.length })}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    marginTop: 3, fontWeight: '500',
  },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Scroll wrap (white, rounded top) ────────────────────────────────────────
  scrollWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  scroll: { paddingTop: 20, paddingHorizontal: 20 },

  // ── Progress ────────────────────────────────────────────────────────────────
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressInfo: { flex: 1 },
  progressLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  progressHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  progressRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  progressNum: { fontSize: 12, fontWeight: '800', color: Colors.white },
  progressBarWrap: {
    height: 6, backgroundColor: Colors.divider,
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressList: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  progressItemText: {
    flex: 1, flexShrink: 1,
    fontSize: 13, fontWeight: '500',
    color: Colors.textPrimary,
  },
  progressItemDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { marginBottom: 22 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primaryLight, fontWeight: '600' },

  // ── Guide card ──────────────────────────────────────────────────────────────
  guideCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideNumBadge: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  guideNumText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  guideBody: { flex: 1 },
  guideRow1: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8, marginBottom: 3,
  },
  guideTitle: { flex: 1, flexShrink: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  guideSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  guideFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  guideTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.divider, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  guideTagText: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },

  // ── AI card ─────────────────────────────────────────────────────────────────
  aiCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  aiTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  aiIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  aiDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
  aiCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
  },
  aiCtaText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // ── Quick actions ───────────────────────────────────────────────────────────
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  quickCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  quickIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
});
