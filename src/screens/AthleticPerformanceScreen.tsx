import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { PERFORMANCE_CATEGORIES } from "../lib/performanceTests";
import { useHomeButton } from "../hooks/useHomeButton";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleticPerformance">;

export default function AthleticPerformanceScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Bir kategori seç, testi seç, sporcunun ölçümünü kaydet.</Text>
        {role === "super_admin" && (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("PerformanceTestForm")}>
            <Text style={styles.addButtonText}>+ Test Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        {PERFORMANCE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tile, { borderColor: cat.color }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("PerformanceCategory", { category: cat.key })}
          >
            <View style={[styles.decorCircle, { backgroundColor: cat.soft }]} />
            <View style={styles.tileContent}>
              <Text style={styles.tileIcon}>{cat.icon}</Text>
              <Text style={styles.tileLabel}>{cat.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.lg },
  subtitle: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    width: "31%", aspectRatio: 1, backgroundColor: colors.surface, borderWidth: 2,
    borderRadius: radius.md, overflow: "hidden",
  },
  decorCircle: {
    position: "absolute", top: -16, right: -16, width: 56, height: 56, borderRadius: 28,
  },
  tileContent: {
    flex: 1, width: "100%", alignItems: "center", justifyContent: "center", padding: 6,
  },
  tileIcon: { fontSize: 24, marginBottom: 2, textAlign: "center" },
  tileLabel: { color: colors.ink, fontSize: 11, fontWeight: "800", textAlign: "center" },
});
