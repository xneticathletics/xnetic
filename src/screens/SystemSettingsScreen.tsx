import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";

// Süper Admin'in alt menüsündeki bağımsız sekme — Ana Sayfa kutucuklarının
// arasından çıkarılıp Kulüp Admini'nin "Kulüp Ayarları" sekmesiyle aynı
// konuma (Ana Menü'nün yanına) taşındı.
export default function SystemSettingsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>Sistem Ayarları</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🚧</Text>
        <Text style={styles.placeholderTitle}>Yakında</Text>
        <Text style={styles.placeholderText}>Platform geneli ayarlar yakında eklenecek.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.lg },
  placeholder: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginTop: spacing.xl,
  },
  placeholderIcon: { fontSize: 36, marginBottom: spacing.sm },
  placeholderTitle: { color: colors.yellow, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  placeholderText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
