import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../hooks/useAuth';
import { alertDialog } from '../../utils/dialog';
import {
  startCheckout,
  returnedFromSuccessfulCheckout,
  clearCheckoutQueryParams,
} from '../../services/payment';

const PERKS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'document-text-outline', text: 'Tous les guides officiels, pas-à-pas' },
  { icon: 'chatbubble-ellipses-outline', text: 'Assistant IA juridique illimité' },
  { icon: 'location-outline', text: 'Services locaux de toute la France' },
  { icon: 'close-circle-outline', text: 'Sans engagement — résiliable à tout moment' },
];

// How long we keep checking after the user returns from Stripe, before giving
// up and showing the manual recovery. The webhook normally lands in 1-3s, but
// we allow generous headroom for a slow/retried delivery. 20 × 2s ≈ 40s.
const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 2000;

export default function PaywallScreen() {
  const { refreshPaymentStatus } = useProfile();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // True the whole time we're auto-confirming a fresh payment (?paid=1). While
  // it's on, we show a dedicated "confirming" screen instead of the paywall, so
  // a paying user never sees "subscribe again" during the webhook's brief lag.
  const [confirming, setConfirming] = useState(() => returnedFromSuccessfulCheckout());
  // Set when confirmation ran the full window without success — surface a clear
  // message instead of silently dropping the user back on the sales screen.
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);

  // Auto-confirm loop: poll has_paid until it flips true (navigator then swaps
  // this screen out on its own) or we exhaust the window.
  useEffect(() => {
    if (!confirming) return;
    let cancelled = false;

    (async () => {
      for (let i = 0; i < POLL_ATTEMPTS && !cancelled; i++) {
        const paid = await refreshPaymentStatus();
        if (paid) return; // success → navigator unmounts this screen
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      }
      if (!cancelled) {
        setConfirming(false);
        setConfirmTimedOut(true);
        clearCheckoutQueryParams();
      }
    })();

    return () => { cancelled = true; };
  }, [confirming, refreshPaymentStatus]);

  const handlePay = useCallback(async () => {
    setBusy(true);
    const result = await startCheckout();
    if (result.ok && 'alreadyPaid' in result) {
      await refreshPaymentStatus();
      setBusy(false);
      return;
    }
    if (!result.ok) {
      alertDialog('Paiement', result.error);
      setBusy(false);
    }
    // On success we redirect to Stripe, so leave `busy` on.
  }, [refreshPaymentStatus]);

  const handleRefresh = useCallback(async () => {
    setVerifying(true);
    const paid = await refreshPaymentStatus();
    setVerifying(false);
    if (!paid) {
      alertDialog(
        'Paiement',
        'Nous n’avons pas encore reçu la confirmation. Si vous venez de payer, ' +
        'patientez un instant puis réessayez.',
      );
    }
  }, [refreshPaymentStatus]);

  // ── Dedicated confirmation screen (right after returning from Stripe) ───────
  if (confirming) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.confirmWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Merci !</Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            Confirmation de votre paiement en cours…{'\n'}Cela ne prend que quelques instants.
          </Text>
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="lock-open-outline" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Débloquez Boussole</Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            Un abonnement mensuel pour un accès complet à tous les guides et à l’assistant IA juridique.
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>1,99 €</Text>
            <Text style={styles.priceNote}>/ mois</Text>
          </View>
        </View>

        {confirmTimedOut && (
          <View style={styles.notice}>
            <Ionicons name="time-outline" size={18} color={Colors.accent} />
            <Text style={styles.noticeText} numberOfLines={3}>
              Si vous venez de payer, votre accès s’active dans un instant.
              Appuyez sur « J’ai déjà payé » ci-dessous.
            </Text>
          </View>
        )}

        <View style={styles.perks}>
          {PERKS.map((p, i) => (
            <View key={i} style={styles.perkRow}>
              <Ionicons name={p.icon} size={20} color={Colors.accent} />
              <Text style={styles.perkText} numberOfLines={2}>{p.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btnPrimary, busy && styles.btnDisabled]}
            onPress={handlePay}
            disabled={busy || verifying}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color={Colors.primary} />
                <Text style={styles.btnPrimaryText}>S’abonner — 1,99 €/mois</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            onPress={handleRefresh}
            disabled={busy || verifying}
            activeOpacity={0.7}
          >
            {verifying
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnGhostText}>J’ai déjà payé — actualiser</Text>}
          </TouchableOpacity>

          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(255,255,255,0.55)" />
            <Text style={styles.secureText} numberOfLines={2}>
              Paiement sécurisé par Stripe. Nous ne voyons jamais votre carte.
            </Text>
          </View>

          <TouchableOpacity onPress={signOut} activeOpacity={0.7} style={styles.logout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 24 },
  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  hero: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 20 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 20, marginTop: 10,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 18 },
  price: { fontSize: 40, fontWeight: '900', color: Colors.accent },
  priceNote: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 24, marginTop: 4,
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderRadius: 12, padding: 12,
  },
  noticeText: { flex: 1, fontSize: 12.5, color: Colors.white, lineHeight: 17 },
  perks: { paddingHorizontal: 28, paddingVertical: 12, gap: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkText: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 19 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 10 },
  btnPrimary: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    minHeight: 54,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  btnGhost: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  btnGhostText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  secureRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 12, marginTop: 2,
  },
  secureText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', flexShrink: 1 },
  logout: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
  logoutText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'underline' },
});
