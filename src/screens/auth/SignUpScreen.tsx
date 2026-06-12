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

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'> };

// Mirrors useAuth validation rules so we can show inline feedback.
const MIN_PASSWORD = 10;

function checkStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= MIN_PASSWORD) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) score++;
  const labels = ['', 'auth.strength.weak', 'auth.strength.fair', 'auth.strength.good', 'auth.strength.strong'];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export default function SignUpScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = checkStrength(password);
  const canSubmit = email.length > 0 && password.length >= MIN_PASSWORD && strength.score >= 2;

  const onSubmit = async () => {
    if (submitting || !canSubmit) return;
    setError(null);
    setSubmitting(true);
    const res = await signUp(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(t(`auth.error.${res.error}`));
      return;
    }
    navigation.navigate('EmailVerification', { email: email.trim().toLowerCase() });
  };

  const strengthColor = ['#E2E8F0', Colors.error, Colors.warning, Colors.info, Colors.success][strength.score];

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
              <Ionicons name="person-add-outline" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.title}>{t('auth.signup.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.field.password')}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(null); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  editable={!submitting}
                />
                <TouchableOpacity onPress={() => setShowPassword(s => !s)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Strength meter */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSeg,
                          { backgroundColor: i <= strength.score ? strengthColor : Colors.border },
                        ]}
                      />
                    ))}
                  </View>
                  {strength.label ? (
                    <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                      {t(strength.label)}
                    </Text>
                  ) : null}
                </View>
              )}

              <Text style={styles.hint}>{t('auth.signup.passwordHint')}</Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.legal}>
              {t('auth.signup.legal')}
            </Text>

            <TouchableOpacity
              style={[styles.btnPrimary, (!canSubmit || submitting) && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={submitting || !canSubmit}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>{t('auth.signup.cta')}</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
              hitSlop={8}
            >
              <Text style={styles.loginLinkText}>
                {t('auth.signup.haveAccount')}{' '}
                <Text style={styles.loginLinkBold}>{t('auth.signup.loginCta')}</Text>
              </Text>
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
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(245,166,35,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center' },
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
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  strengthBar: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 64, textAlign: 'right' },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error, fontWeight: '500' },
  legal: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  btnPrimary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  loginLink: { alignSelf: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 13, color: Colors.textSecondary },
  loginLinkBold: { color: Colors.primaryLight, fontWeight: '700' },
});
