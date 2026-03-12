import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/ProfileContext';
import { GUIDES, GUIDE_CATEGORIES } from '../../constants/guides';
import { Colors } from '../../constants/colors';
import { Guide, GuideCategory } from '../../types';

const SITUATION_LABELS: Record<string, string> = {
  new_arrival: 'Récemment arrivé(e)',
  resident:    'Résident(e) établi(e)',
  student:     'Étudiant(e)',
  worker:      'Travailleur/se',
  family:      'Regroupement familial',
  refugee:     'Demandeur d\'asile',
};

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

const DIFFICULTY_LABEL: Record<string, string> = {
  easy:   'Facile',
  medium: 'Intermédiaire',
  hard:   'Complexe',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   Colors.success,
  medium: Colors.warning,
  hard:   Colors.error,
};

export default function HomeScreen() {
  const { profile } = useProfile();
  const navigation = useNavigation<any>();

  if (!profile) return null;

  const priorityGuides = GUIDES.filter(g =>
    g.relevantFor.includes(profile.situation)
  ).slice(0, 3);

  const recentlyUpdated = GUIDES.slice(0, 4);

  const completedCount = profile.completedGuides.length;
  const totalCount = GUIDES.filter(g => g.relevantFor.includes(profile.situation)).length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Top header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.headerSub}>{SITUATION_LABELS[profile.situation]}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Votre progression</Text>
            <Text style={styles.progressCount}>{completedCount}/{totalCount} guides</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {completedCount === 0
              ? 'Commencez par les guides prioritaires ci-dessous !'
              : `Continuez — ${totalCount - completedCount} démarches restantes.`}
          </Text>
        </View>

        {/* Priority guides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Prioritaire pour vous</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Guides')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {priorityGuides.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              isCompleted={profile.completedGuides.includes(guide.id)}
              onPress={() => navigation.navigate('Guides', {
                screen: 'GuideDetail',
                params: { guideId: guide.id },
              })}
            />
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.quickGrid}>
            {GUIDE_CATEGORIES.slice(0, 4).map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.quickCard}
                onPress={() => navigation.navigate('Guides')}
                activeOpacity={0.75}
              >
                <Text style={styles.quickEmoji}>{cat.emoji}</Text>
                <Text style={styles.quickLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI CTA */}
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.85}
        >
          <View style={styles.aiLeft}>
            <View style={styles.aiIcon}>
              <Ionicons name="chatbubble-ellipses" size={22} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.aiTitle}>Une question sur la bureaucratie ?</Text>
              <Text style={styles.aiDesc}>Notre IA répond en français, anglais ou portugais</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.accent} />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideCard({ guide, isCompleted, onPress }: {
  guide: Guide;
  isCompleted: boolean;
  onPress: () => void;
}) {
  const catColor = CATEGORY_COLORS[guide.category];
  return (
    <TouchableOpacity style={styles.guideCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.guideCatBar, { backgroundColor: catColor }]} />
      <View style={styles.guideCardContent}>
        <View style={styles.guideCardTop}>
          <Text style={styles.guideEmoji}>{guide.emoji}</Text>
          <View style={styles.guideMeta}>
            <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[guide.difficulty] + '22' }]}>
              <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[guide.difficulty] }]}>
                {DIFFICULTY_LABEL[guide.difficulty]}
              </Text>
            </View>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            )}
          </View>
        </View>
        <Text style={styles.guideTitle}>{guide.title}</Text>
        <Text style={styles.guideSub}>{guide.subtitle}</Text>
        <View style={styles.guideFooter}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.guideTime}>{guide.estimatedTime}</Text>
          <Text style={styles.guideSteps}>{guide.steps.length} étapes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingTop: 20, paddingHorizontal: 20 },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  progressCount: { fontSize: 13, color: Colors.textSecondary },
  progressBar: {
    height: 8, backgroundColor: Colors.divider,
    borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.success,
    borderRadius: 4, minWidth: 8,
  },
  progressHint: { fontSize: 12, color: Colors.textSecondary },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primaryLight, fontWeight: '600' },
  guideCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideCatBar: { width: 5 },
  guideCardContent: { flex: 1, padding: 14 },
  guideCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  guideEmoji: { fontSize: 20 },
  guideMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  diffText: { fontSize: 11, fontWeight: '700' },
  guideTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  guideSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  guideFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  guideTime: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  guideSteps: { fontSize: 11, color: Colors.textMuted },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  quickEmoji: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  aiCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  aiIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(245,166,35,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  aiDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
});
