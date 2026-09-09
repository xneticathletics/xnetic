import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import {
  getIndividualProgram, listIndividualProgramItems, deleteIndividualProgram,
  type IndividualFitnessProgram, type IndividualFitnessProgramItem,
} from "../lib/api/individualFitnessPrograms";
import {
  listMeasurementsForAthleteExercise, createFitnessMeasurement, type FitnessMeasurement,
} from "../lib/api/fitnessMeasurements";
import SetEntryList, { type SetEntry } from "../components/SetEntryList";
import { useAuth } from "../context/AuthContext";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "IndividualFitnessProgramDetail">;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// FitnessProgramDetailScreen'in "Hareketler" bölümüne benzer, ama tek
// seferlik bir "Tamamladım" formu yok — bireysel program tekrar tekrar
// kullanılan bir şablon olduğu için her hareketin set girişi sürekli açık;
// sporcu istediği zaman istediği hareket için yeni bir kayıt ekleyebiliyor.
export default function IndividualFitnessProgramDetailScreen({ route, navigation }: Props) {
  const { programId, athleteId } = route.params;
  const { role } = useAuth();
  const canDelete = role === "club_admin" || role === "athlete";
  const { handleFocus } = useKeyboardScroll();

  const [program, setProgram] = useState<IndividualFitnessProgram | null>(null);
  const [items, setItems] = useState<IndividualFitnessProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Record<string, FitnessMeasurement[]>>({});
  const [setsByItem, setSetsByItem] = useState<Record<string, SetEntry[]>>({});
  const [savingItem, setSavingItem] = useState<string | null>(null);

  const loadHistory = useCallback(async (currentItems: IndividualFitnessProgramItem[]) => {
    const entries = await Promise.all(
      currentItems.map(async (item) => [item.id, await listMeasurementsForAthleteExercise(athleteId, item.exercise_key)] as const)
    );
    setHistory(Object.fromEntries(entries));
  }, [athleteId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([getIndividualProgram(programId), listIndividualProgramItems(programId)])
        .then(async ([p, i]) => {
          if (cancelled) return;
          setProgram(p);
          setItems(i);
          navigation.setOptions({ title: p.name });
          await loadHistory(i);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [programId, navigation, loadHistory])
  );

  const handleSaveItem = async (item: IndividualFitnessProgramItem) => {
    const rows = setsByItem[item.id] ?? [];
    const measuredAt = todayKey();
    const calls = rows
      .map((row) => {
        const repsNum = row.reps.trim() ? Number(row.reps.trim()) : null;
        if (repsNum == null || !Number.isFinite(repsNum)) return null;
        const weightNum = row.weight.trim() ? Number(row.weight.trim().replace(",", ".")) : null;
        return createFitnessMeasurement({
          athlete_id: athleteId,
          exercise_key: item.exercise_key,
          weight_kg: weightNum,
          sets: 1,
          reps: repsNum,
          measured_at: measuredAt,
          notes: `Bireysel Program: ${program?.name ?? ""}`,
        });
      })
      .filter((c): c is Promise<unknown> => !!c);

    if (calls.length === 0) {
      return Alert.alert("Eksik bilgi", "En az bir set için tekrar sayısı girmelisin.", [{ text: "Tamam" }]);
    }

    setSavingItem(item.id);
    try {
      await Promise.all(calls);
      setSetsByItem((prev) => ({ ...prev, [item.id]: [] }));
      await loadHistory(items);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setSavingItem(null);
    }
  };

  const handleDelete = () => {
    Alert.alert("Programı Sil", "Bu bireysel programı silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          try {
            await deleteIndividualProgram(programId);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{program?.name}</Text>
        {program && <Text style={styles.dateText}>{new Date(program.created_at).toLocaleDateString("tr-TR")}</Text>}

        {items.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={styles.itemName}>
              {item.exercise_name} <Text style={styles.itemTarget}>(hedef {item.sets}×{item.reps})</Text>
            </Text>

            <SetEntryList
              value={setsByItem[item.id] ?? []}
              onChange={(rows) => setSetsByItem((prev) => ({ ...prev, [item.id]: rows }))}
              onFocus={handleFocus}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveItem(item)}
              disabled={savingItem === item.id}
            >
              {savingItem === item.id ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>

            {(history[item.id]?.length ?? 0) > 0 && (
              <View style={styles.historyBox}>
                {history[item.id].slice(0, 3).map((m) => (
                  <View key={m.id} style={styles.historyRow}>
                    <Text style={styles.historyValue}>
                      {m.weight_kg != null ? `${m.weight_kg} kg` : "Vücut ağırlığı"} × {m.reps} tekrar
                    </Text>
                    <Text style={styles.historyDate}>{formatDate(m.measured_at)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Programı Sil</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: 4 },
  dateText: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  itemBlock: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  itemName: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: spacing.sm },
  itemTarget: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  saveButton: { backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 10, alignItems: "center", marginTop: 2 },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  historyBox: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.xs },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  historyValue: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  historyDate: { color: colors.muted, fontSize: 12 },
  deleteButton: { alignItems: "center", paddingVertical: spacing.lg, marginBottom: spacing.xl },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
});
