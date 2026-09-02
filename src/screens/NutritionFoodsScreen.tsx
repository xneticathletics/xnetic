import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { FOOD_CATEGORIES } from "../lib/nutritionCategories";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionFoods">;

export default function NutritionFoodsScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.subtitle}>Bir kategori seç — örnek besinler, faydaları ve sporcu tarifleri seni bekliyor.</Text>

      <View style={styles.grid}>
        {FOOD_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tile, { borderColor: cat.color }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("NutritionFoodCategory", { category: cat.key })}
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
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.xs },
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
  tileIcon: { fontSize: 40, marginBottom: spacing.sm, textAlign: "center" },
  tileLabel: { color: colors.ink, fontSize: 15, fontWeight: "800", textAlign: "center" },
});
