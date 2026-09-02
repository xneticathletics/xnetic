import React, { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listNutritionFoodsByCategory, type NutritionFood } from "../lib/api/nutritionFoods";
import { listNutritionRecipesByCategory, type NutritionRecipe } from "../lib/api/nutritionRecipes";
import { getFoodCategory } from "../lib/nutritionCategories";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionFoodCategory">;

// Kutucuk sıkıcı bir liste gibi görünmesin diye her kategori için kısa,
// ilgi çekici bir giriş cümlesi — sabit, kod içinde.
const INTRO_TEXT: Record<string, string> = {
  karbonhidrat: "Vücudun ana yakıtı! Antrenman ve maç günü enerjinin büyük kısmı buradan gelir.",
  protein: "Kasların onarımı ve gelişimi için yapı taşı — özellikle antrenman sonrası kritik.",
  yag: "Enerji deposu ve hormon üretimi için gerekli — doğru yağı doğru miktarda almak önemli.",
  vitamin: "Bağışıklık, enerji üretimi ve kas fonksiyonları için küçük ama güçlü destekçiler.",
};

const FOODS_SECTION_LABEL: Record<string, string> = {
  vitamin: "Önemli Vitaminler",
};

export default function NutritionFoodCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const { role } = useAuth();
  const meta = getFoodCategory(category);
  const foodsLabel = FOODS_SECTION_LABEL[category] ?? "Örnek Besinler";

  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [recipes, setRecipes] = useState<NutritionRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    navigation.setOptions({ title: meta.label });
  }, [meta.label, navigation]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [f, r] = await Promise.all([listNutritionFoodsByCategory(category), listNutritionRecipesByCategory(category)]);
      setFoods(f);
      setRecipes(r);
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  type Row =
    | { kind: "header" }
    | { kind: "sectionHeader"; title: string; onAdd?: () => void }
    | { kind: "food"; data: NutritionFood }
    | { kind: "recipe"; data: NutritionRecipe }
    | { kind: "empty"; text: string };

  const rows: Row[] = [{ kind: "header" }];
  rows.push({
    kind: "sectionHeader",
    title: foodsLabel,
    onAdd: role === "club_admin" ? () => navigation.navigate("NutritionFoodForm", { foodId: undefined, category }) : undefined,
  });
  if (foods.length === 0 && !loading) rows.push({ kind: "empty", text: "Henüz eklenmedi." });
  foods.forEach((f) => rows.push({ kind: "food", data: f }));
  rows.push({
    kind: "sectionHeader",
    title: "Sporcu Tarifleri",
    onAdd: role === "club_admin" ? () => navigation.navigate("NutritionRecipeForm", { recipeId: undefined, category }) : undefined,
  });
  if (recipes.length === 0 && !loading) rows.push({ kind: "empty", text: "Henüz tarif eklenmedi." });
  recipes.forEach((r) => rows.push({ kind: "recipe", data: r }));

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={rows}
        keyExtractor={(row, idx) =>
          row.kind === "food" ? `food-${row.data.id}` : row.kind === "recipe" ? `recipe-${row.data.id}` : `${row.kind}-${idx}`
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        renderItem={({ item }) => {
          if (item.kind === "header") {
            return (
              <View style={[styles.heroCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
                <Text style={styles.heroIcon}>{meta.icon}</Text>
                <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.heroIntro}>{INTRO_TEXT[category]}</Text>
              </View>
            );
          }
          if (item.kind === "sectionHeader") {
            return (
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionHeaderBar, { backgroundColor: meta.color }]} />
                <Text style={styles.sectionHeaderText}>{item.title}</Text>
                {item.onAdd && (
                  <TouchableOpacity style={[styles.addButton, { borderColor: meta.color }]} onPress={item.onAdd}>
                    <Text style={[styles.addButtonText, { color: meta.color }]}>+ Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }
          if (item.kind === "empty") {
            return <Text style={styles.empty}>{item.text}</Text>;
          }
          if (item.kind === "food") {
            const f = item.data;
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("NutritionFoodDetail", { foodId: f.id })}>
                <Text style={styles.cardName}>{f.name}</Text>
                {!!f.description && <Text style={styles.cardDesc} numberOfLines={2}>{f.description}</Text>}
                {!!f.found_in && <Text style={styles.cardFoundIn}>📍 {f.found_in}</Text>}
                {(f.calories != null || f.protein_g != null || f.carbs_g != null || f.fat_g != null) && (
                  <View style={styles.macroRow}>
                    {f.calories != null && <Text style={[styles.macroBadge, { color: meta.color, backgroundColor: meta.soft }]}>{f.calories} kcal</Text>}
                    {f.protein_g != null && <Text style={[styles.macroBadge, { color: meta.color, backgroundColor: meta.soft }]}>P: {f.protein_g}g</Text>}
                    {f.carbs_g != null && <Text style={[styles.macroBadge, { color: meta.color, backgroundColor: meta.soft }]}>K: {f.carbs_g}g</Text>}
                    {f.fat_g != null && <Text style={[styles.macroBadge, { color: meta.color, backgroundColor: meta.soft }]}>Y: {f.fat_g}g</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          }
          const r = item.data;
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("NutritionRecipeDetail", { recipeId: r.id })}>
              <Text style={styles.cardName}>🍳 {r.title}</Text>
              {!!r.description && <Text style={styles.cardDesc} numberOfLines={2}>{r.description}</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  error: { color: colors.coral, marginBottom: spacing.md },
  heroCard: {
    borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg,
  },
  heroIcon: { fontSize: 44, marginBottom: spacing.xs },
  heroTitle: { fontSize: 18, fontWeight: "800", marginBottom: spacing.xs, textAlign: "center" },
  heroIntro: { color: colors.ink, fontSize: 12, lineHeight: 18, textAlign: "center" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionHeaderBar: { width: 3, height: 12, borderRadius: 2 },
  sectionHeaderText: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  addButton: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  addButtonText: { fontSize: 11, fontWeight: "700" },
  empty: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, alignItems: "center",
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700", textAlign: "center" },
  cardDesc: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  cardFoundIn: { color: colors.muted, fontSize: 11, marginTop: 4, fontStyle: "italic", textAlign: "center" },
  macroRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: spacing.sm },
  macroBadge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
});
