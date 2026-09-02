import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { ARTICLE_CATEGORIES } from "../lib/nutritionCategories";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionArticles">;

export default function NutritionArticlesScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.subtitle}>Güne göre beslenme önerileri — bilimsel kaynaklara dayanır.</Text>

      <View style={styles.stack}>
        {ARTICLE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tile, { borderColor: cat.color, backgroundColor: cat.soft }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("NutritionArticleCategory", { category: cat.key })}
          >
            <Text style={styles.tileIcon}>{cat.icon}</Text>
            <Text style={[styles.tileLabel, { color: cat.color }]}>{cat.label}</Text>
            <Text style={styles.tileArrow}>›</Text>
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
  stack: { gap: spacing.md },
  tile: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg,
  },
  tileIcon: { fontSize: 32 },
  tileLabel: { flex: 1, fontSize: 15, fontWeight: "800" },
  tileArrow: { color: colors.muted, fontSize: 20, fontWeight: "700" },
});
