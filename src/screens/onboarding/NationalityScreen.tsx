import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList, TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Nationality'> };

const COUNTRIES = [
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'CN', name: 'Chine', flag: '🇨🇳' },
  { code: 'IN', name: 'Inde', flag: '🇮🇳' },
  { code: 'TR', name: 'Turquie', flag: '🇹🇷' },
  { code: 'RO', name: 'Roumanie', flag: '🇷🇴' },
  { code: 'PL', name: 'Pologne', flag: '🇵🇱' },
  { code: 'MX', name: 'Mexique', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombie', flag: '🇨🇴' },
  { code: 'OTHER', name: 'Autre pays', flag: '🌍' },
];

export default function NationalityScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>Quelle est votre nationalité ?</Text>
        <Text style={styles.subtitle}>Cela nous aide à personnaliser les informations selon votre situation.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Chercher un pays..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Country list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.code}
        style={styles.list}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.countryRow, selected === item.code && styles.countryRowSelected]}
            onPress={() => setSelected(item.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.flag}>{item.flag}</Text>
            <Text style={[styles.countryName, selected === item.code && styles.countryNameSelected]}>
              {item.name}
            </Text>
            {selected === item.code && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />
            )}
          </TouchableOpacity>
        )}
      />

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnNext, !selected && styles.btnNextDisabled]}
          onPress={() => selected && navigation.navigate('Situation')}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.btnNextText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  progress: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primaryLight, width: 20 },
  titleArea: { paddingHorizontal: 24, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  list: { flex: 1 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  countryRowSelected: {
    borderColor: Colors.primaryLight,
    backgroundColor: '#EEF4FF',
  },
  flag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  countryNameSelected: { color: Colors.primaryLight, fontWeight: '700' },
  footer: { paddingHorizontal: 20, paddingVertical: 16 },
  btnNext: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnNextDisabled: { backgroundColor: Colors.border },
  btnNextText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
