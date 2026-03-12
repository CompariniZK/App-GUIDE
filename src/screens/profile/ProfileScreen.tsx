import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/ProfileContext';
import { GUIDES } from '../../constants/guides';
import { Colors } from '../../constants/colors';

const SITUATION_LABELS: Record<string, string> = {
  new_arrival: 'Récemment arrivé(e)',
  resident:    'Résident(e) établi(e)',
  student:     'Étudiant(e) international(e)',
  worker:      'Travailleur / Travailleuse',
  family:      'Regroupement familial',
  refugee:     'Demandeur(se) d\'asile',
};

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

export default function ProfileScreen() {
  const { profile, resetProfile } = useProfile();

  if (!profile) return null;

  const completed = profile.completedGuides.length;
  const saved     = profile.savedGuides.length;
  const total     = GUIDES.filter(g => g.relevantFor.includes(profile.situation)).length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser le profil',
      'Cela effacera votre progression et vos préférences. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: resetProfile },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 36 }}>{COUNTRY_FLAGS[profile.nationality] || '🌍'}</Text>
          </View>
          <Text style={styles.situationLabel}>{SITUATION_LABELS[profile.situation]}</Text>
          <Text style={styles.langLabel}>{LANG_LABELS[profile.language]}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{completed}</Text>
            <Text style={styles.statLabel}>Terminés</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={[styles.statNum, { color: Colors.primaryLight }]}>{pct}%</Text>
            <Text style={styles.statLabel}>Progression</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.accent }]}>{saved}</Text>
            <Text style={styles.statLabel}>Sauvegardés</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Guides complétés</Text>
            <Text style={styles.progressCount}>{completed}/{total}</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {/* Settings sections */}
        <Text style={styles.sectionLabel}>Paramètres</Text>

        <View style={styles.menuCard}>
          <SettingRow icon="globe-outline"       label="Langue de l'app"      value={LANG_LABELS[profile.language]} />
          <SettingRow icon="person-outline"      label="Ma situation"          value={SITUATION_LABELS[profile.situation]} />
          <SettingRow icon="notifications-outline" label="Notifications"       value="Activées" />
          <SettingRow icon="moon-outline"        label="Mode sombre"           value="Désactivé" last />
        </View>

        <Text style={styles.sectionLabel}>À propos</Text>

        <View style={styles.menuCard}>
          <SettingRow icon="shield-checkmark-outline" label="Politique de confidentialité" />
          <SettingRow icon="document-text-outline"    label="Conditions d'utilisation" />
          <SettingRow icon="information-circle-outline" label="Version de l'app"         value="1.0.0" last />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={16} color={Colors.error} />
          <Text style={styles.resetText}>Réinitialiser le profil</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Boussole — Votre guide en France{'\n'}
          Données issues de service-public.fr et legifrance.gouv.fr
        </Text>

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
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.error,
    marginBottom: 20,
  },
  resetText: { fontSize: 14, color: Colors.error, fontWeight: '700' },
  footer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
