import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Linking, Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GUIDES } from '../../constants/guides';
import { Colors } from '../../constants/colors';
import { GuideCategory, GuidesStackParamList } from '../../types';
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

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: Colors.success, medium: Colors.warning, hard: Colors.error,
};

export default function GuideDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<GuidesStackParamList, 'GuideDetail'>>();
  const { guideId } = route.params;
  const { profile, markGuideCompleted, toggleSavedGuide } = useProfile();
  const { t } = useTranslation();

  const guide = GUIDES.find(g => g.id === guideId);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  if (!guide) return null;

  const isCompleted = profile?.completedGuides.includes(guide.id) ?? false;
  const isSaved     = profile?.savedGuides.includes(guide.id) ?? false;
  const catColor    = CATEGORY_COLORS[guide.category];

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t('guideDetail.error'), t('guideDetail.errorLink'))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={catColor} />

      <View style={[styles.hero, { backgroundColor: catColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={() => toggleSavedGuide(guide.id)}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={Colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>{guide.emoji}</Text>
        <Text style={styles.heroTitle}>{t(`guide.${guide.id}.title`)}</Text>
        <Text style={styles.heroSub}>{t(`guide.${guide.id}.subtitle`)}</Text>
        <View style={styles.heroBadges}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={12} color={Colors.white} />
            <Text style={styles.badgeText}>{t(`guide.${guide.id}.time`)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: DIFFICULTY_COLOR[guide.difficulty] + '88' }]}>
            <Text style={styles.badgeText}>{t(`difficulty.${guide.difficulty}`)}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('guideDetail.steps', { count: guide.steps.length })}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {guide.officialSource && (
          <TouchableOpacity
            style={styles.sourceLink}
            onPress={() => openLink(guide.officialSource!)}
          >
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.sourceLinkText}>{t('guideDetail.source')}</Text>
            <Ionicons name="open-outline" size={14} color={Colors.primaryLight} />
          </TouchableOpacity>
        )}

        <Text style={styles.stepsTitle}>{t('guideDetail.stepsTitle')}</Text>
        {guide.steps.map((step, index) => {
          const isExpanded = expandedStep === step.id;
          const stepNum = index + 1;
          const stepKey = `guide.${guide.id}.step${stepNum}`;
          return (
            <View key={step.id} style={styles.stepCard}>
              <TouchableOpacity
                style={styles.stepHeader}
                onPress={() => setExpandedStep(isExpanded ? null : step.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.stepNumber, { backgroundColor: catColor }]}>
                  <Text style={styles.stepNumberText}>{stepNum}</Text>
                </View>
                <Text style={styles.stepTitle}>{t(`${stepKey}.title`)}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.stepBody}>
                  <Text style={styles.stepDesc}>{t(`${stepKey}.desc`)}</Text>

                  {step.documents && step.documents.length > 0 && (
                    <View style={styles.docsBox}>
                      <Text style={styles.docsTitle}>
                        <Ionicons name="document-attach-outline" size={13} color={Colors.primaryLight} />
                        {'  '}{t('guideDetail.documents')}
                      </Text>
                      {step.documents.map((_, i) => (
                        <View key={i} style={styles.docRow}>
                          <View style={[styles.docDot, { backgroundColor: catColor }]} />
                          <Text style={styles.docText}>{t(`${stepKey}.doc${i + 1}`)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {step.tip && (
                    <View style={styles.tipBox}>
                      <Ionicons name="bulb-outline" size={15} color={Colors.accent} />
                      <Text style={styles.tipText}>{t(`${stepKey}.tip`)}</Text>
                    </View>
                  )}

                  {step.officialLink && (
                    <TouchableOpacity
                      style={styles.officialBtn}
                      onPress={() => openLink(step.officialLink!)}
                    >
                      <Ionicons name="globe-outline" size={14} color={Colors.primaryLight} />
                      <Text style={styles.officialBtnText}>{t('guideDetail.officialSite')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
          onPress={() => markGuideCompleted(guide.id)}
          disabled={isCompleted}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={isCompleted ? Colors.white : Colors.success}
          />
          <Text style={[styles.completeBtnText, isCompleted && { color: Colors.white }]}>
            {isCompleted ? t('guideDetail.completed') : t('guideDetail.complete')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { position: 'absolute', top: 12, left: 20, padding: 4 },
  saveBtn: { position: 'absolute', top: 12, right: 20, padding: 4 },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginBottom: 14 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  content: { padding: 20 },
  sourceLink: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20,
  },
  sourceLinkText: { flex: 1, fontSize: 13, color: Colors.primaryLight, fontWeight: '600' },
  stepsTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  stepNumber: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { fontSize: 13, fontWeight: '800', color: Colors.white },
  stepTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  stepBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderColor: Colors.divider },
  stepDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginTop: 12, marginBottom: 10 },
  docsBox: {
    backgroundColor: Colors.divider, borderRadius: 10, padding: 12, marginBottom: 10,
  },
  docsTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  docRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 },
  docDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  docText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF8ED', borderRadius: 10, padding: 12, marginBottom: 10,
  },
  tipText: { flex: 1, fontSize: 12, color: '#92600A', lineHeight: 17 },
  officialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8,
  },
  officialBtnText: { fontSize: 13, color: Colors.primaryLight, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 16, marginTop: 20,
    backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.success,
  },
  completeBtnDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: Colors.success },
});
