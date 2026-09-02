import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getNutritionFood, deleteNutritionFood, type NutritionFood } from "../lib/api/nutritionFoods";
import { getFoodCategory } from "../lib/nutritionCategories";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionFoodDetail">;

function MacroBox({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <View style={styles.macroBox}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

export default function NutritionFoodDetailScreen({ route, navigation }: Props) {
  const { foodId } = route.params;
  const { role } = useAuth();
  const [food, setFood] = useState<NutritionFood | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getNutritionFood(foodId)
        .then(setFood)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [foodId])
  );

  const handleDelete = () => {
    if (!food) return;
    Alert.alert(
      "Besini sil",
      `"${food.name}" kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNutritionFood(food.id);
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

  if (error || !food) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Besin bulunamadı."}</Text>
      </View>
    );
  }

  const meta = getFoodCategory(food.category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.categoryBadge, { backgroundColor: meta.soft }]}>
        <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
      </View>

      <Text style={styles.name}>{food.name}</Text>
      {!!food.description && <Text style={styles.description}>{food.description}</Text>}

      {!!food.found_in && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nerede Bulunur</Text>
          <Text style={styles.sectionText}>{food.found_in}</Text>
        </View>
      )}

      {(food.calories != null || food.protein_g != null || food.carbs_g != null || food.fat_g != null) && (
        <View style={styles.macroRow}>
          <MacroBox label="Kalori" value={food.calories} />
          <MacroBox label="Protein (g)" value={food.protein_g} />
          <MacroBox label="Karbonhidrat (g)" value={food.carbs_g} />
          <MacroBox label="Yağ (g)" value={food.fat_g} />
        </View>
      )}

      {!!food.benefit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sporcuya Faydası</Text>
          <Text style={styles.sectionText}>{food.benefit}</Text>
        </View>
      )}

      {!!food.source && (
        <View style={styles.sourceBox}>
          <Text style={styles.sourceLabel}>Kaynakça</Text>
          <Text style={styles.sourceText}>{food.source}</Text>
        </View>
      )}

      {role === "club_admin" && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("NutritionFoodForm", { foodId: food.id, category: food.category })}
          >
            <Text style={styles.editButtonText}>✎ Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
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
  name: { color: colors.ink, fontSize: 22, fontWeight: "800", marginBottom: spacing.xs },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  macroRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  macroBox: {
    flexGrow: 1, minWidth: 70, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center",
  },
  macroValue: { color: colors.teal, fontSize: 16, fontWeight: "800" },
  macroLabel: { color: colors.muted, fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },
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
