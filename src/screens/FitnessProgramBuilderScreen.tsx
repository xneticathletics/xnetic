import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { FITNESS_CATEGORIES, getFitnessCategory } from "../lib/fitnessExercises";
import { listCustomExercisesByCategory } from "../lib/api/customFitnessExercises";
import { listGroups, type Group } from "../lib/api/groups";
import { publishFitnessProgram, type FitnessProgramItemInput } from "../lib/api/fitnessPrograms";
import { getCurrentAppUserId } from "../lib/api/currentUser";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessProgramBuilder">;

type ExerciseOption = { key: string; name: string };

export default function FitnessProgramBuilderScreen({ navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [items, setItems] = useState<FitnessProgramItemInput[]>([]);

  const [category, setCategory] = useState<string | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [exerciseKey, setExerciseKey] = useState<string | null>(null);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  const [finalizing, setFinalizing] = useState(false);
  const [name, setName] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handlePublish iki kez çalışıp aynı programı iki
  // kez yayınlayabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setExerciseOptions([]);
      return;
    }
    const meta = getFitnessCategory(category);
    const staticOptions: ExerciseOption[] = meta ? meta.exercises.map((e) => ({ key: e.key, name: e.name })) : [];
    listCustomExercisesByCategory(category)
      .then((custom) => {
        setExerciseOptions([...staticOptions, ...custom.map((c) => ({ key: `custom:${c.id}`, name: c.name }))]);
      })
      .catch(() => setExerciseOptions(staticOptions));
  }, [category]);

  useEffect(() => {
    if (!finalizing) return;
    setLoadingGroups(true);
    listGroups()
      .then(setGroups)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingGroups(false));
  }, [finalizing]);

  const selectedExerciseName = exerciseOptions.find((e) => e.key === exerciseKey)?.name ?? null;

  const handleAddItem = () => {
    if (!category || !exerciseKey || !selectedExerciseName) {
      return Alert.alert("Eksik bilgi", "Bölge ve hareket seçmelisin.", [{ text: "Tamam" }]);
    }
    const setsNum = Number(sets);
    const repsNum = Number(reps);
    if (!setsNum || setsNum <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir set sayısı gir.", [{ text: "Tamam" }]);
    if (!repsNum || repsNum <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir tekrar sayısı gir.", [{ text: "Tamam" }]);

    setItems((prev) => [...prev, { category, exercise_key: exerciseKey, exercise_name: selectedExerciseName, sets: setsNum, reps: repsNum }]);
    setExerciseKey(null);
    setSets("");
    setReps("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Program adı girmelisin.", [{ text: "Tamam" }]);
    if (!groupId) return Alert.alert("Eksik bilgi", "Bir grup seçmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const myUserId = await getCurrentAppUserId();
      await publishFitnessProgram({ name: name.trim(), group_id: groupId, created_by: myUserId, items });
      Alert.alert("Gönderildi", "Program yayınlandı ve gruptaki herkese bildirim gönderildi.", [{ text: "Tamam" }]);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {!finalizing ? (
          <>
            {items.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Eklenen Hareketler</Text>
                {items.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.itemRow} onLongPress={() => handleRemoveItem(index)}>
                    <Text style={styles.itemName}>{item.exercise_name}</Text>
                    <Text style={styles.itemDetail}>{item.sets} set × {item.reps} tekrar</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.hint}>Bir hareketi silmek için üzerine uzun bas.</Text>
              </>
            )}

            <Text style={styles.sectionTitle}>Hareket Ekle</Text>

            <Text style={styles.label}>Bölge</Text>
            <View style={styles.chipGrid}>
              {FITNESS_CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.chip, { borderColor: cat.color }, active && { backgroundColor: cat.color }]}
                    onPress={() => { setCategory(cat.key); setExerciseKey(null); }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.icon} {cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {category && (
              <>
                <Text style={styles.label}>Hareket</Text>
                <View style={styles.chipGrid}>
                  {exerciseOptions.map((ex) => {
                    const active = exerciseKey === ex.key;
                    return (
                      <TouchableOpacity
                        key={ex.key}
                        style={[styles.chip, styles.chipNeutral, active && styles.chipNeutralActive]}
                        onPress={() => setExerciseKey(ex.key)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{ex.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {exerciseKey && (
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Set Sayısı *</Text>
                  <TextInput
                    onFocus={handleFocus}
                    style={styles.input}
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="numeric"
                    placeholder="Örn. 3"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Tekrar Sayısı *</Text>
                  <TextInput
                    onFocus={handleFocus}
                    style={styles.input}
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                    placeholder="Örn. 12"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            )}

            {exerciseKey && (
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Text style={styles.addItemButtonText}>+ Programa Ekle</Text>
              </TouchableOpacity>
            )}

            {items.length > 0 && (
              <TouchableOpacity style={styles.completeButton} onPress={() => setFinalizing(true)}>
                <Text style={styles.completeButtonText}>Programı Tamamla</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setFinalizing(false)}>
              <Text style={styles.backLink}>‹ Hareket eklemeye geri dön</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Programı Sonlandır</Text>

            <Text style={styles.label}>Program Adı *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn. Haftalık Kuvvet Programı"
              placeholderTextColor={colors.muted}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Hangi Gruba Sergilenecek? *</Text>
            {loadingGroups && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.sm }} />}
            <View style={styles.chipGrid}>
              {groups.map((g) => {
                const active = groupId === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.chip, styles.chipNeutral, active && styles.chipNeutralActive]}
                    onPress={() => setGroupId(g.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.name} · {g.branch}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.completeButton} onPress={handlePublish} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.completeButtonText}>Gönder ve Sergile</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: spacing.sm },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 10 },
  chipNeutral: { borderColor: colors.line, backgroundColor: colors.surface },
  chipNeutralActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.bg, fontWeight: "800" },
  row: { flexDirection: "row", gap: spacing.sm },
  rowItem: { flex: 1 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  addItemButton: {
    borderWidth: 1, borderColor: colors.violet, borderRadius: radius.md, paddingVertical: 12,
    alignItems: "center", marginTop: spacing.md,
  },
  addItemButtonText: { color: colors.violet, fontWeight: "700", fontSize: 14 },
  itemRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  itemName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemDetail: { color: colors.muted, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 11, fontStyle: "italic", marginBottom: spacing.sm },
  completeButton: { backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  completeButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  backLink: { color: colors.teal, fontSize: 13, fontWeight: "600", marginBottom: spacing.md },
  errorText: { color: colors.coral, marginTop: spacing.md, textAlign: "center" },
});
