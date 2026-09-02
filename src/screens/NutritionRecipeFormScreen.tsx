import React, { useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getNutritionRecipe, createNutritionRecipe, updateNutritionRecipe } from "../lib/api/nutritionRecipes";
import { getFoodCategory } from "../lib/nutritionCategories";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionRecipeForm">;

export default function NutritionRecipeFormScreen({ route, navigation }: Props) {
  const { recipeId, category } = route.params;
  const meta = getFoodCategory(category);
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(!!recipeId);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı tarifi iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!recipeId) return;
      getNutritionRecipe(recipeId)
        .then((r) => {
          setTitle(r.title);
          setDescription(r.description ?? "");
          setIngredients(r.ingredients ?? "");
          setInstructions(r.instructions ?? "");
          setSource(r.source ?? "");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [recipeId])
  );

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!title.trim()) return Alert.alert("Eksik bilgi", "Tarif adı zorunludur.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const input = {
        category,
        title: title.trim(),
        description: description.trim() || null,
        ingredients: ingredients.trim() || null,
        instructions: instructions.trim() || null,
        source: source.trim() || null,
      };
      if (recipeId) {
        await updateNutritionRecipe(recipeId, input);
      } else {
        await createNutritionRecipe(input);
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
          Sporcular için pratik ve besleyici bir tarif ekle — mümkünse bir
          kaynağa dayandır.
        </Text>

        <Field label="Tarif Adı *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Örn. Yulaflı Muzlu Kahvaltı Kasesi"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Kısa Açıklama">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Bu tarif ne için iyi?"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Malzemeler">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={ingredients}
            onChangeText={setIngredients}
            placeholder={"Her satıra bir malzeme yazabilirsin"}
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Yapılışı">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultilineTall]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Adım adım hazırlanışı"
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
            placeholder="Varsa dayandığı kaynak"
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
  inputMultilineTall: { minHeight: 120, textAlignVertical: "top" },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
