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
  getProgram, listProgramItems, deleteProgram, listCompletionsForProgram, markProgramCompleted,
  type FitnessProgram, type FitnessProgramItem, type FitnessProgramCompletion,
} from "../lib/api/fitnessPrograms";
import { useAuth } from "../context/AuthContext";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessProgramDetail">;

const DIFFICULTY_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FitnessProgramDetailScreen({ route, navigation }: Props) {
  const { role } = useAuth();
  const canManage = role === "coach" || role === "club_admin";
  const { programId, athleteId, athleteName } = route.params;
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [items, setItems] = useState<FitnessProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [completions, setCompletions] = useState<FitnessProgramCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [note, setNote] = useState("");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
  const [marking, setMarking] = useState(false);

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

      if (canManage) {
        setLoadingCompletions(true);
        listCompletionsForProgram(programId)
          .then((data) => { if (!cancelled) setCompletions(data); })
          .finally(() => { if (!cancelled) setLoadingCompletions(false); });
      }
      return () => { cancelled = true; };
    }, [programId, canManage])
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
      await markProgramCompleted({
        program_id: programId,
        athlete_id: athleteId,
        note: note.trim() || null,
        difficulty,
        duration_minutes: duration.trim() ? Number(duration) : null,
      });
      // Tamamlama formu artık ekranda kalmıyor — doğrudan Sporcu Takip
      // Merkezi'ne (Performansım) dönülüyor, geçmiş oradaki "Çalışma"
      // bölümünde görünüyor (bkz. AthleteFitnessViewScreen).
      navigation.navigate("AthleteTrackingHub", { athleteId, athleteName: athleteName ?? "" });
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
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

            <Text style={styles.label}>Zorluk Derecesi (1-10)</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTY_SCALE.map((n) => {
                const active = difficulty === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.difficultyChip, active && styles.difficultyChipActive]}
                    onPress={() => setDifficulty(active ? null : n)}
                  >
                    <Text style={[styles.difficultyChipText, active && styles.difficultyChipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Süre (dakika)</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.durationInput}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="Örn. 45"
              placeholderTextColor={colors.muted}
            />

            <TouchableOpacity style={styles.completeButton} onPress={handleMarkCompleted} disabled={marking}>
              {marking ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.completeButtonText}>✓ Antrenmanı Tamamladım</Text>}
            </TouchableOpacity>
          </View>
        )}

        {canManage && (
          <>
            <Text style={styles.sectionTitle}>Tamamlayanlar</Text>
            {loadingCompletions ? (
              <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.sm }} />
            ) : completions.length === 0 ? (
              <Text style={styles.emptyText}>Bu programı henüz kimse tamamladı olarak işaretlemedi.</Text>
            ) : (
              completions.map((c) => (
                <View key={c.id} style={styles.completionRow}>
                  <Text style={styles.completionName}>{c.athletes?.full_name ?? "Sporcu"}</Text>
                  <Text style={styles.completionDate}>
                    {formatDateTime(c.completed_at)}
                    {c.difficulty != null ? ` · Zorluk: ${c.difficulty}/10` : ""}
                    {c.duration_minutes != null ? ` · ${c.duration_minutes} dk` : ""}
                  </Text>
                  {!!c.note && <Text style={styles.completionNote}>{c.note}</Text>}
                </View>
              ))
            )}
          </>
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
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: spacing.sm },
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
  },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  difficultyChip: {
    width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.bg, alignItems: "center", justifyContent: "center",
  },
  difficultyChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  difficultyChipText: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  difficultyChipTextActive: { color: colors.bg },
  durationInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  completeButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
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
