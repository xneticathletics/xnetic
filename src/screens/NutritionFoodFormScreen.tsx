import React, { useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getNutritionFood, createNutritionFood, updateNutritionFood } from "../lib/api/nutritionFoods";
import { getFoodCategory } from "../lib/nutritionCategories";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionFoodForm">;

function toNumberOrNull(v: string): number | null {
  const trimmed = v.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function NutritionFoodFormScreen({ route, navigation }: Props) {
  const { foodId, category } = route.params;
  const meta = getFoodCategory(category);
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [foundIn, setFoundIn] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [benefit, setBenefit] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(!!foodId);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı besini iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!foodId) return;
      getNutritionFood(foodId)
        .then((f) => {
          setName(f.name);
          setDescription(f.description ?? "");
          setFoundIn(f.found_in ?? "");
          setCalories(f.calories != null ? String(f.calories) : "");
          setProtein(f.protein_g != null ? String(f.protein_g) : "");
          setCarbs(f.carbs_g != null ? String(f.carbs_g) : "");
          setFat(f.fat_g != null ? String(f.fat_g) : "");
          setBenefit(f.benefit ?? "");
          setSource(f.source ?? "");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [foodId])
  );

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Besin adı zorunludur.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const input = {
        category,
        name: name.trim(),
        description: description.trim() || null,
        found_in: foundIn.trim() || null,
        calories: toNumberOrNull(calories),
        protein_g: toNumberOrNull(protein),
        carbs_g: toNumberOrNull(carbs),
        fat_g: toNumberOrNull(fat),
        benefit: benefit.trim() || null,
        source: source.trim() || null,
      };
      if (foodId) {
        await updateNutritionFood(foodId, input);
      } else {
        await createNutritionFood(input);
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={[styles.categoryBadge, { backgroundColor: meta.soft }]}>
          <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
        </View>

        <Text style={styles.infoBox}>
          Girdiğin bilgilerin bilimsel bir kaynağa (makale, sağlık kuruluşu vb.)
          dayandığından ve Kaynakça alanına eklendiğinden emin ol.
        </Text>

        <Field label="Besin Adı *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Örn. Yulaf"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Kısa Açıklama">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Besin hakkında kısa bir açıklama"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Nerede Bulunur">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={foundIn}
            onChangeText={setFoundIn}
            placeholder="Örn. Portakal, kivi, kırmızı biber"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Field label="Kalori">
              <TextInput
                onFocus={handleFocus}
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="Örn. 389"
                placeholderTextColor={colors.muted}
              />
            </Field>
          </View>
          <View style={styles.rowItem}>
            <Field label="Protein (g)">
              <TextInput
                onFocus={handleFocus}
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="Örn. 17"
                placeholderTextColor={colors.muted}
              />
            </Field>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Field label="Karbonhidrat (g)">
              <TextInput
                onFocus={handleFocus}
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="Örn. 66"
                placeholderTextColor={colors.muted}
              />
            </Field>
          </View>
          <View style={styles.rowItem}>
            <Field label="Yağ (g)">
              <TextInput
                onFocus={handleFocus}
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholder="Örn. 7"
                placeholderTextColor={colors.muted}
              />
            </Field>
          </View>
        </View>

        <Field label="Sporcuya Faydası">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={benefit}
            onChangeText={setBenefit}
            placeholder="Bu besin sporcuya nasıl fayda sağlar?"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Kaynakça">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={source}
            onChangeText={setSource}
            placeholder="Örn. Harvard T.H. Chan School of Public Health, 2023"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  categoryBadge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.md },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: spacing.sm },
  rowItem: { flex: 1 },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
