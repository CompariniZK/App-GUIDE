import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/ProfileContext';
import { GUIDES } from '../../constants/guides';
import { Colors } from '../../constants/colors';
import { AppLanguage } from '../../types';
import { useTranslation } from '../../i18n';
import { CITIES, getCityById } from '../../constants/cities';

const LANG_LABELS: Record<string, string> = {
  fr: '🇫🇷 Français',
  en: '🇬🇧 English',
  pt: '🇧🇷 Português',
  es: '🇪🇸 Español',
  ar: '🇲🇦 العربية',
};

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', MA: '🇲🇦', DZ: '🇩🇿', TN: '🇹🇳', PT: '🇵🇹',
  ES: '🇪🇸', SN: '🇸🇳', ML: '🇲🇱', CM: '🇨🇲', CI: '🇨🇮',
  NG: '🇳🇬', PH: '🇵🇭', CN: '🇨🇳', IN: '🇮🇳', TR: '🇹🇷',
  RO: '🇷🇴', PL: '🇵🇱', MX: '🇲🇽', CO: '🇨🇴', OTHER: '🌍',
};

const LANGUAGES: AppLanguage[] = ['fr', 'en', 'pt', 'es', 'ar'];

export default function ProfileScreen() {
  const { profile, resetProfile, setProfile, setCity } = useProfile();
  const { t } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  if (!profile) return null;

  const completed = profile.completedGuides.length;
  const saved     = profile.savedGuides.length;
  const total     = GUIDES.filter(g => g.relevantFor.includes(profile.situation)).length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleReset = () => {
    Alert.alert(
      t('profile.resetTitle'),
      t('profile.resetMessage'),
      [
        { text: t('profile.resetCancel'), style: 'cancel' },
        { text: t('profile.resetConfirm'), style: 'destructive', onPress: resetProfile },
      ]
    );
  };

  const handleChangeLanguage = (lang: AppLanguage) => {
    setProfile({ ...profile, language: lang });
    setShowLangPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 36 }}>{COUNTRY_FLAGS[profile.nationality] || '🌍'}</Text>
          </View>
          <Text style={styles.situationLabel}>{t(`situationLabel.${profile.situation}`)}</Text>
          <Text style={styles.langLabel}>{LANG_LABELS[profile.language]}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{completed}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.completed')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={[styles.statNum, { color: Colors.primaryLight }]}>{pct}%</Text>
            <Text style={styles.statLabel}>{t('profile.stats.progress')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.accent }]}>{saved}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.saved')}</Text>
          </View>
        </View>

        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t('profile.guidesCompleted')}</Text>
            <Text style={styles.progressCount}>{completed}/{total}</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.settings')}</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowLangPicker(!showLangPicker)}
          >
            <Ionicons name="globe-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowLabel}>{t('profile.language')}</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{LANG_LABELS[profile.language]}</Text>
              <Ionicons name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.langPicker}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langOption, profile.language === lang && styles.langOptionActive]}
                  onPress={() => handleChangeLanguage(lang)}
                >
                  <Text style={[styles.langOptionText, profile.language === lang && styles.langOptionTextActive]}>
                    {LANG_LABELS[lang]}
                  </Text>
                  {profile.language === lang && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primaryLight} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <SettingRow icon="person-outline" label={t('profile.situation')} value={t(`situationLabel.${profile.situation}`)} />
          <SettingRow icon="notifications-outline" label={t('profile.notifications')} value={t('profile.notificationsValue')} />
          <SettingRow icon="moon-outline" label={t('profile.darkMode')} value={t('profile.darkModeValue')} last />
        </View>

        {/* ─── City / Ville Mode ─────────────────────────── */}
        <Text style={styles.sectionLabel}>🏙 Mode Ville</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowLabel}>Ville partenaire</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>
                {profile.cityId ? getCityById(profile.cityId)?.name ?? profile.cityId : 'Aucune'}
              </Text>
              <Ionicons name={showCityPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {showCityPicker && (
            <View style={styles.langPicker}>
              {/* Option: no city */}
              <TouchableOpacity
                style={[styles.langOption, !profile.cityId && styles.langOptionActive]}
                onPress={async () => {
                  await setCity('');
                  setShowCityPicker(false);
                }}
              >
                <Text style={[styles.langOptionText, !profile.cityId && styles.langOptionTextActive]}>
                  🌍 Aucune ville
                </Text>
                {!profile.cityId && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primaryLight} />
                )}
              </TouchableOpacity>

              {/* All configured cities */}
              {CITIES.map(city => (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.langOption, profile.cityId === city.id && styles.langOptionActive]}
                  onPress={async () => {
                    await setCity(city.id);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[styles.langOptionText, profile.cityId === city.id && styles.langOptionTextActive]}>
                    🏛 {city.name} ({city.department})
                  </Text>
                  {profile.cityId === city.id && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primaryLight} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {profile.cityId && (
            <View style={styles.cityActiveRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.cityActiveText}>
                Mode ville activé — les ressources locales apparaissent sur l'accueil
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>{t('profile.about')}</Text>

        <View style={styles.menuCard}>
          <SettingRow icon="shield-checkmark-outline" label={t('profile.privacy')} />
          <SettingRow icon="document-text-outline" label={t('profile.terms')} />
          <SettingRow icon="information-circle-outline" label={t('profile.version')} value="1.0.0" last />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={16} color={Colors.error} />
          <Text style={styles.resetText}>{t('profile.reset')}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>{t('profile.footer')}</Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon, label, value, last = false,
}: { icon: string; label: string; value?: string; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.row, last && styles.rowLast]} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  profileCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  situationLabel: { fontSize: 17, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  langLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statCardMiddle: { borderColor: Colors.primaryLight, borderWidth: 2 },
  statNum: { fontSize: 24, fontWeight: '800', color: Colors.success, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  progressBox: {
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 16,
    marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  progressCount: { fontSize: 13, color: Colors.textSecondary },
  bar: { height: 8, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primaryLight, borderRadius: 4, minWidth: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 13, color: Colors.textSecondary },
  langPicker: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingVertical: 4,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 48,
    paddingVertical: 12,
  },
  langOptionActive: { backgroundColor: Colors.selectedBg },
  langOptionText: { fontSize: 14, color: Colors.textPrimary },
  langOptionTextActive: { color: Colors.primaryLight, fontWeight: '700' },
  cityActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.successBg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  cityActiveText: {
    fontSize: 12,
    color: Colors.success,
    flex: 1,
    flexShrink: 1,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.error,
    marginBottom: 20,
  },
  resetText: { fontSize: 14, color: Colors.error, fontWeight: '700' },
  footer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
