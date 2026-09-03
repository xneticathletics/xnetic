import React, { useCallback, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import {
  getProgram, listProgramItems, deleteProgram,
  listCompletionsForAthleteProgram, listCompletionsForProgram, markProgramCompleted,
  type FitnessProgram, type FitnessProgramItem, type FitnessProgramCompletion,
} from "../lib/api/fitnessPrograms";
import { useAuth } from "../context/AuthContext";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessProgramDetail">;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FitnessProgramDetailScreen({ route, navigation }: Props) {
  const { role } = useAuth();
  const canManage = role === "coach" || role === "club_admin";
  const { programId, athleteId } = route.params;
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [items, setItems] = useState<FitnessProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [completions, setCompletions] = useState<FitnessProgramCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [note, setNote] = useState("");
  const [marking, setMarking] = useState(false);

  const loadCompletions = useCallback(() => {
    if (canManage) {
      setLoadingCompletions(true);
      listCompletionsForProgram(programId)
        .then(setCompletions)
        .finally(() => setLoadingCompletions(false));
    } else if (athleteId) {
      setLoadingCompletions(true);
      listCompletionsForAthleteProgram(programId, athleteId)
        .then(setCompletions)
        .finally(() => setLoadingCompletions(false));
    }
  }, [canManage, programId, athleteId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([getProgram(programId), listProgramItems(programId)])
        .then(([p, i]) => {
          if (cancelled) return;
          setProgram(p);
          setItems(i);
          navigation.setOptions({ title: p.name });
        })
        .finally(() => { if (!cancelled) setLoading(false); });
      loadCompletions();
      return () => { cancelled = true; };
    }, [programId, loadCompletions])
  );

  const handleDelete = () => {
    Alert.alert("Programı Sil", "Bu programı silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          await deleteProgram(programId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleMarkCompleted = async () => {
    if (!athleteId) return;
    setMarking(true);
    try {
      await markProgramCompleted({ program_id: programId, athlete_id: athleteId, note: note.trim() || null });
      setNote("");
      loadCompletions();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setMarking(false);
    }
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
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{program?.name}</Text>
        {program?.groups && (
          <Text style={styles.groupText}>{program.groups.name} · {program.groups.branch}</Text>
        )}
        {program && (
          <Text style={styles.dateText}>{new Date(program.created_at).toLocaleDateString("tr-TR")}</Text>
        )}

        <Text style={styles.sectionTitle}>Hareketler</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.exercise_name}</Text>
            <Text style={styles.itemDetail}>{item.sets} set × {item.reps} tekrar</Text>
          </View>
        ))}

        {!canManage && athleteId && (
          <View style={styles.completeBox}>
            <Text style={styles.sectionTitle}>Antrenmanı Tamamladım</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Not ekle (isteğe bağlı) — örn. nasıl geçti, zorlandığın hareket var mı"
              placeholderTextColor={colors.muted}
              multiline
            />
            <TouchableOpacity style={styles.completeButton} onPress={handleMarkCompleted} disabled={marking}>
              {marking ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.completeButtonText}>✓ Antrenmanı Tamamladım</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>{canManage ? "Tamamlayanlar" : "Geçmişim"}</Text>
        {loadingCompletions ? (
          <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.sm }} />
        ) : completions.length === 0 ? (
          <Text style={styles.emptyText}>
            {canManage ? "Bu programı henüz kimse tamamladı olarak işaretlemedi." : "Henüz bu programı tamamladım demedin."}
          </Text>
        ) : (
          completions.map((c) => (
            <View key={c.id} style={styles.completionRow}>
              <View style={{ flex: 1 }}>
                {canManage && <Text style={styles.completionName}>{c.athletes?.full_name ?? "Sporcu"}</Text>}
                <Text style={styles.completionDate}>{formatDateTime(c.completed_at)}</Text>
                {!!c.note && <Text style={styles.completionNote}>{c.note}</Text>}
              </View>
            </View>
          ))
        )}

        {canManage && (
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
  groupText: { color: colors.violet, fontSize: 13, fontWeight: "600", marginBottom: 2 },
  dateText: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: spacing.sm, marginTop: spacing.lg },
  itemRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  itemName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemDetail: { color: colors.muted, fontSize: 12 },
  completeBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg,
  },
  noteInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, minHeight: 60, textAlignVertical: "top",
    marginBottom: spacing.sm,
  },
  completeButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  completeButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  emptyText: { color: colors.muted, fontSize: 12, fontStyle: "italic" },
  completionRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  completionName: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  completionDate: { color: colors.muted, fontSize: 11 },
  completionNote: { color: colors.ink, fontSize: 12, marginTop: 4, fontStyle: "italic" },
  deleteButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.xl,
  },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
