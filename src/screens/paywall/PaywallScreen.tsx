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
  { icon: 'infinite-outline', text: 'Accès à vie — paiement unique, sans abonnement' },
];

export default function PaywallScreen() {
  const { refreshPaymentStatus } = useProfile();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Coming back from Stripe (?paid=1): the webhook may lag a beat, so poll a
  // few times before giving up. When has_paid flips true, the navigator swaps
  // this screen out automatically.
  useEffect(() => {
    if (!returnedFromSuccessfulCheckout()) return;
    let cancelled = false;
    setVerifying(true);

    (async () => {
      for (let i = 0; i < 6 && !cancelled; i++) {
        const paid = await refreshPaymentStatus();
        if (paid) break;
        await new Promise(r => setTimeout(r, 1500));
      }
      if (!cancelled) {
        setVerifying(false);
        clearCheckoutQueryParams();
      }
    })();

    return () => { cancelled = true; };
  }, [refreshPaymentStatus]);

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
    if (!paid) alertDialog('Paiement', 'Aucun paiement détecté pour le moment.');
  }, [refreshPaymentStatus]);

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
            Un paiement unique pour un accès complet et à vie à tous les guides et à l’assistant IA.
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>1,99 €</Text>
            <Text style={styles.priceNote}>paiement unique</Text>
          </View>
        </View>

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
                <Text style={styles.btnPrimaryText}>Débloquer pour 1,99 €</Text>
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
