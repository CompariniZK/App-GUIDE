import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useTranslation } from '../../i18n';
import { supabase } from '../../services/supabase';
import type { AuthStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'EmailVerification'>;
  route: RouteProp<AuthStackParamList, 'EmailVerification'>;
};

export default function EmailVerificationScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { email } = route.params;
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const onResend = async () => {
    if (resending) return;
    setResending(true);
    // Generic success regardless to avoid email enumeration
    await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 5000);
  };

  const openMailApp = async () => {
    // Try to open the default mail app
    try {
      await Linking.openURL('mailto:');
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={48} color={Colors.accent} />
        </View>

        <Text style={styles.title}>{t('auth.verify.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.verify.subtitle')}
        </Text>

        <View style={styles.emailBox}>
          <Ionicons name="at" size={16} color={Colors.primaryLight} />
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <Text style={styles.instructions}>
          {t('auth.verify.instructions')}
        </Text>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={openMailApp}
          activeOpacity={0.85}
        >
          <Ionicons name="mail-open-outline" size={18} color={Colors.white} />
          <Text style={styles.btnPrimaryText}>{t('auth.verify.openMail')}</Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {resent ? (
            <Text style={styles.resentText}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />{' '}
              {t('auth.verify.resent')}
            </Text>
          ) : (
            <TouchableOpacity onPress={onResend} disabled={resending} hitSlop={8}>
              {resending ? (
                <ActivityIndicator size="small" color={Colors.primaryLight} />
              ) : (
                <Text style={styles.resendText}>
                  {t('auth.verify.noEmail')}{' '}
                  <Text style={styles.resendLink}>{t('auth.verify.resend')}</Text>
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          hitSlop={8}
        >
          <Text style={styles.loginLinkText}>
            {t('auth.verify.alreadyVerified')}{' '}
            <Text style={styles.loginLinkBold}>{t('auth.verify.loginNow')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  body: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(245,166,35,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  emailBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.selectedBg,
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 20,
  },
  emailText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  instructions: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  btnPrimary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  resendRow: { marginTop: 20, minHeight: 20 },
  resendText: { fontSize: 13, color: Colors.textSecondary },
  resendLink: { color: Colors.primaryLight, fontWeight: '700' },
  resentText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  loginLink: { marginTop: 24, paddingVertical: 8 },
  loginLinkText: { fontSize: 13, color: Colors.textSecondary },
  loginLinkBold: { color: Colors.primaryLight, fontWeight: '700' },
});
