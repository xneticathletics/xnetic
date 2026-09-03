import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { FITNESS_CATEGORIES } from "../lib/fitnessExercises";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessTraining">;

export default function FitnessTrainingScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("FitnessExerciseForm")}>
          <Text style={styles.addButtonText}>+ Çalışma Ekle</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Bir bölge seç, egzersizi seç, sporcunun kaldırdığı ağırlığı/tekrarı kaydet.</Text>

      <View style={styles.grid}>
        {FITNESS_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tile, { borderColor: cat.color }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("FitnessCategory", { category: cat.key })}
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
  headerRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%", aspectRatio: 1, backgroundColor: colors.surface, borderWidth: 2,
    borderRadius: radius.lg, overflow: "hidden",
  },
  decorCircle: {
    position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: 45,
  },
  tileContent: {
    flex: 1, width: "100%", alignItems: "center", justifyContent: "center", padding: spacing.sm,
  },
  tileIcon: { fontSize: 36, marginBottom: spacing.xs, textAlign: "center" },
  tileLabel: { color: colors.ink, fontSize: 14, fontWeight: "800", textAlign: "center" },
  tileCount: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: "center" },
});
