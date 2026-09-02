import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { PERFORMANCE_CATEGORIES } from "../lib/performanceTests";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleticPerformance">;

export default function AthleticPerformanceScreen({ navigation }: Props) {
  useHomeButton(navigation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.subtitle}>Bir kategori seç, testi seç, sporcunun ölçümünü kaydet.</Text>

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
              <Text style={styles.tileCount}>{cat.tests.length} test</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: spacing.lg },
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
  tileCount: { color: colors.muted, fontSize: 9, marginTop: 2, textAlign: "center" },
});
