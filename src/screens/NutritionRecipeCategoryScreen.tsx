import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listNutritionRecipesByCategory, type NutritionRecipe } from "../lib/api/nutritionRecipes";
import { getFoodCategory } from "../lib/nutritionCategories";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionRecipeCategory">;

// Bir satırın global mi (club_id null) yoksa kulübe özel mi olduğuna göre
// kaynak etiketi (sadece Süper Admin'e) hesaplar — NutritionFoodCategoryScreen'deki
// birebir aynı mantık (ayrı dosyada kasıtlı kopya).
function sourceLabel(role: string | null, clubId: string | null, clubs: { name: string } | null | undefined): string | undefined {
  if (role !== "super_admin") return undefined;
  return clubId === null ? "🌐 Global (Platform)" : `🏢 ${clubs?.name ?? "Bir kulüp"}`;
}

export default function NutritionRecipeCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const { role } = useAuth();
  const meta = getFoodCategory(category);

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
      setRecipes(await listNutritionRecipesByCategory(category));
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

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListHeaderComponent={
          <>
            <View style={[styles.heroCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
              <Text style={styles.heroIcon}>🍳</Text>
              <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label} Tarifleri</Text>
            </View>
            {role === "club_admin" && (
              <TouchableOpacity
                style={[styles.addButton, { borderColor: meta.color }]}
                onPress={() => navigation.navigate("NutritionRecipeForm", { recipeId: undefined, category })}
              >
                <Text style={[styles.addButtonText, { color: meta.color }]}>+ Tarif Ekle</Text>
              </TouchableOpacity>
            )}
          </>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bu kategoride henüz tarif eklenmedi.</Text> : null}
        renderItem={({ item }) => {
          const label = sourceLabel(role, item.club_id, item.clubs);
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("NutritionRecipeDetail", { recipeId: item.id })}>
              <Text style={styles.cardName}>🍳 {item.title}</Text>
              {!!label && <Text style={styles.cardSource}>{label}</Text>}
              {!!item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
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
    borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.md,
  },
  heroIcon: { fontSize: 44, marginBottom: spacing.xs },
  heroTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  addButton: {
    alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6, marginBottom: spacing.md,
  },
  addButtonText: { fontSize: 12, fontWeight: "700" },
  empty: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, alignItems: "center",
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700", textAlign: "center" },
  cardSource: { color: colors.muted, fontSize: 10, marginTop: 2, textAlign: "center" },
  cardDesc: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
});
