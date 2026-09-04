import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getNutritionRecipe, deleteNutritionRecipe, type NutritionRecipe } from "../lib/api/nutritionRecipes";
import { getFoodCategory } from "../lib/nutritionCategories";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionRecipeDetail">;

export default function NutritionRecipeDetailScreen({ route, navigation }: Props) {
  const { recipeId } = route.params;
  const { role, clubId: myClubId } = useAuth();
  const [recipe, setRecipe] = useState<NutritionRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getNutritionRecipe(recipeId)
        .then(setRecipe)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [recipeId])
  );

  const handleDelete = () => {
    if (!recipe) return;
    Alert.alert(
      "Tarifi sil",
      `"${recipe.title}" tarifini silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNutritionRecipe(recipe.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Tarif bulunamadı."}</Text>
      </View>
    );
  }

  const meta = getFoodCategory(recipe.category);
  const canEdit = recipe.club_id === null ? role === "coach" || role === "club_admin" || role === "super_admin" : recipe.club_id === myClubId;
  const canDelete = recipe.club_id === null ? role === "super_admin" : recipe.club_id === myClubId && role === "club_admin";
  const sourceLabel =
    role === "super_admin" ? (recipe.club_id === null ? "🌐 Global (Platform)" : `🏢 ${recipe.clubs?.name ?? "Bir kulüp"}`) : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.categoryBadge, { backgroundColor: meta.soft }]}>
        <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
      </View>
      {!!sourceLabel && <Text style={styles.sourceBadge}>{sourceLabel}</Text>}

      <Text style={styles.title}>🍳 {recipe.title}</Text>
      {!!recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

      {!!recipe.ingredients && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Malzemeler</Text>
          <Text style={styles.sectionText}>{recipe.ingredients}</Text>
        </View>
      )}

      {!!recipe.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yapılışı</Text>
          <Text style={styles.sectionText}>{recipe.instructions}</Text>
        </View>
      )}

      {!!recipe.source && (
        <View style={styles.sourceBox}>
          <Text style={styles.sourceLabel}>Kaynakça</Text>
          <Text style={styles.sourceText}>{recipe.source}</Text>
        </View>
      )}

      {(canEdit || canDelete) && (
        <View style={styles.actionsRow}>
          {canEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("NutritionRecipeForm", { recipeId: recipe.id, category: recipe.category })}
            >
              <Text style={styles.editButtonText}>✎ Düzenle</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Sil</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  error: { color: colors.coral },
  categoryBadge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.sm },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  sourceBadge: { color: colors.muted, fontSize: 11, marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: spacing.xs },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.yellow, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  sectionText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  sourceBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  sourceLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  sourceText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  editButton: { flex: 1, backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  editButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  deleteButton: { flex: 1, borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
