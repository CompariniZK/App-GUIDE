import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const res = await resetPassword(email);
    setSubmitting(false);
    if (!res.ok) {
      // For security, we don't want to leak whether the email exists.
      // Show generic success even on most errors (except invalid format).
      if (res.error === 'invalid_email') {
        setError(t('auth.error.invalid_email'));
        return;
      }
    }
    setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerArea}>
          <View style={styles.successCircle}>
            <Ionicons name="mail-open-outline" size={48} color={Colors.success} />
          </View>
          <Text style={styles.title}>{t('auth.forgot.sentTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgot.sentDesc')}</Text>

          <TouchableOpacity
            style={[styles.btnPrimary, { marginTop: 24 }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>{t('auth.forgot.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleArea}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={28} color={Colors.primaryLight} />
            </View>
            <Text style={styles.title}>{t('auth.forgot.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgot.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.field.email')}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="email@exemple.fr"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!submitting}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={submitting || !email}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnPrimaryText}>{t('auth.forgot.cta')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  titleArea: { paddingHorizontal: 24, marginBottom: 24, alignItems: 'center' },
  centerArea: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(37,99,235,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  successCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center' },
  form: { paddingHorizontal: 24, gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 0 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error, fontWeight: '500' },
  btnPrimary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
