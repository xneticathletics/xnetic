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
  getProgram, listProgramItems, deleteProgram, listCompletionsForProgram, markProgramCompleted, getMyCompletionForProgram,
  type FitnessProgram, type FitnessProgramItem, type FitnessProgramCompletion,
} from "../lib/api/fitnessPrograms";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { createFitnessMeasurement, listMeasurementsNearCompletion, type FitnessMeasurement } from "../lib/api/fitnessMeasurements";
import SetEntryList, { type SetEntry } from "../components/SetEntryList";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessProgramDetail">;

const DIFFICULTY_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function FitnessProgramDetailScreen({ route, navigation }: Props) {
  const { role } = useAuth();
  const { isLocked } = useBranchSelect();
  const canManage = role === "coach" || role === "club_admin";
  // Silme sadece club_admin ve branş koordinatörüne açık.
  const canDelete = role === "club_admin" || (role === "coach" && isLocked);
  const { programId, athleteId, athleteName } = route.params;
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [items, setItems] = useState<FitnessProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [completions, setCompletions] = useState<FitnessProgramCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  // Bir "Tamamlayanlar" satırına dokununca o sporcunun o gün girdiği
  // set bazlı ağırlık/tekrar detayları açılır (lazy — sadece açılınca çekilir).
  const [expandedCompletionId, setExpandedCompletionId] = useState<string | null>(null);
  const [completionDetails, setCompletionDetails] = useState<Record<string, FitnessMeasurement[]>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  // "Bir Sporcu İçin Gir" kaldırıldı — program artık her zaman bir Fitness
  // Grubuna atanıyor, admin/koordinatörün ayrıca tek tek sporcu seçip
  // onun adına giriş yapmasına gerek yok (kullanıcı kararı). Tamamlama
  // formu sadece sporcunun kendi hesabından, kendi adına gösterilir.
  const targetAthleteId = athleteId;
  const targetAthleteName = athleteName;
  const showLogSection = !canManage && !!athleteId;

  const [myCompletion, setMyCompletion] = useState<FitnessProgramCompletion | null>(null);
  const [loadingMyCompletion, setLoadingMyCompletion] = useState(false);
  const [note, setNote] = useState("");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
  const [setsByItem, setSetsByItem] = useState<Record<string, SetEntry[]>>({});
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

  // Sporcu bir programı sadece bir kez tamamlayabiliyor (DB'de
  // unique(program_id, athlete_id) kısıtı var) — daha önce tamamladıysa
  // formu tekrar göstermiyoruz. targetAthleteId değiştiğinde (koordinatör
  // farklı bir sporcu seçtiğinde) yeniden kontrol ediliyor.
  useFocusEffect(
    useCallback(() => {
      if (!showLogSection || !targetAthleteId) {
        setMyCompletion(null);
        return;
      }
      let cancelled = false;
      setLoadingMyCompletion(true);
      getMyCompletionForProgram(programId, targetAthleteId)
        .then((data) => { if (!cancelled) setMyCompletion(data); })
        .finally(() => { if (!cancelled) setLoadingMyCompletion(false); });
      return () => { cancelled = true; };
    }, [programId, targetAthleteId, showLogSection])
  );

  const handleToggleCompletion = async (c: FitnessProgramCompletion) => {
    if (expandedCompletionId === c.id) {
      setExpandedCompletionId(null);
      return;
    }
    setExpandedCompletionId(c.id);
    if (completionDetails[c.id]) return;
    setLoadingDetailId(c.id);
    try {
      const measurements = await listMeasurementsNearCompletion(c.athlete_id, c.completed_at);
      const itemKeys = new Set(items.map((i) => i.exercise_key));
      setCompletionDetails((prev) => ({ ...prev, [c.id]: measurements.filter((m) => itemKeys.has(m.exercise_key)) }));
    } catch {
      setCompletionDetails((prev) => ({ ...prev, [c.id]: [] }));
    } finally {
      setLoadingDetailId(null);
    }
  };

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
    if (!targetAthleteId) return;
    setMarking(true);
    try {
      await markProgramCompleted({
        program_id: programId,
        athlete_id: targetAthleteId,
        note: note.trim() || null,
        difficulty,
        duration_minutes: duration.trim() ? Number(duration) : null,
      });

      // Her hareketin girilen set satırlarını (ağırlık+tekrar) ayrı ayrı
      // fitness_measurements'a yazıyoruz — boş bırakılan setler atlanıyor,
      // hiçbiri zorunlu değil. Aynı exercise_key sözlüğünü paylaştığı için
      // bu kayıtlar AthleteFitnessViewScreen'deki genel egzersiz geçmişinde
      // de otomatik görünüyor.
      const measuredAt = todayKey();
      const logCalls: Promise<unknown>[] = [];
      items.forEach((item) => {
        (setsByItem[item.id] ?? []).forEach((row) => {
          const repsNum = row.reps.trim() ? Number(row.reps.trim()) : null;
          if (repsNum == null || !Number.isFinite(repsNum)) return;
          const weightNum = row.weight.trim() ? Number(row.weight.trim().replace(",", ".")) : null;
          logCalls.push(
            createFitnessMeasurement({
              athlete_id: targetAthleteId,
              exercise_key: item.exercise_key,
              weight_kg: weightNum,
              sets: 1,
              reps: repsNum,
              measured_at: measuredAt,
              notes: `Program: ${program?.name ?? ""}`,
            })
          );
        });
      });
      await Promise.all(logCalls);

      // Tamamlama formu artık ekranda kalmıyor — doğrudan Sporcu Takip
      // Merkezi'ne (Performansım) dönülüyor, geçmiş oradaki "Çalışma"
      // bölümünde görünüyor (bkz. AthleteFitnessViewScreen).
      navigation.navigate("AthleteTrackingHub", { athleteId: targetAthleteId, athleteName: targetAthleteName ?? "" });
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
        {program?.fitness_groups && (
          <Text style={styles.groupText}>🎯 {program.fitness_groups.name} · {program.fitness_groups.branch}</Text>
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

        {showLogSection && loadingMyCompletion && (
          <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.lg }} />
        )}

        {showLogSection && !loadingMyCompletion && myCompletion && (
          <View style={styles.completedBox}>
            <Text style={styles.completedTitle}>✓ Bu antrenmanı tamamladın</Text>
            <Text style={styles.completionDate}>
              {formatDateTime(myCompletion.completed_at)}
              {myCompletion.difficulty != null ? ` · Zorluk: ${myCompletion.difficulty}/10` : ""}
              {myCompletion.duration_minutes != null ? ` · ${myCompletion.duration_minutes} dk` : ""}
            </Text>
            {!!myCompletion.note && <Text style={styles.completionNote}>{myCompletion.note}</Text>}
          </View>
        )}

        {showLogSection && !loadingMyCompletion && !myCompletion && (
          <View style={styles.completeBox}>
            <Text style={styles.sectionTitle}>Antrenmanı Tamamladım</Text>

            <Text style={styles.label}>Set Bazlı Ağırlık ve Tekrar</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.setItemBlock}>
                <Text style={styles.setItemName}>
                  {item.exercise_name} <Text style={styles.setItemTarget}>(hedef {item.sets}×{item.reps})</Text>
                </Text>
                <SetEntryList
                  value={setsByItem[item.id] ?? []}
                  onChange={(rows) => setSetsByItem((prev) => ({ ...prev, [item.id]: rows }))}
                  onFocus={handleFocus}
                />
              </View>
            ))}

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
              {marking ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.completeButtonText}>✓ Antrenmanı Tamamladım</Text>
              )}
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
              completions.map((c) => {
                const expanded = expandedCompletionId === c.id;
                const details = completionDetails[c.id] ?? [];
                // Set kayıtlarını hareket adına göre grupla — her hareketin
                // altında girilen tüm setler (kaç kg × kaç tekrar) sırayla listelensin.
                const byExercise = new Map<string, FitnessMeasurement[]>();
                details.forEach((m) => {
                  if (!byExercise.has(m.exercise_key)) byExercise.set(m.exercise_key, []);
                  byExercise.get(m.exercise_key)!.push(m);
                });
                return (
                  <TouchableOpacity key={c.id} style={styles.completionRow} onPress={() => handleToggleCompletion(c)}>
                    <View style={styles.completionRowTop}>
                      <Text style={styles.completionName}>{c.athletes?.full_name ?? "Sporcu"}</Text>
                      <Text style={styles.chevronSmall}>{expanded ? "︿" : "﹀"}</Text>
                    </View>
                    <Text style={styles.completionDate}>
                      {formatDateTime(c.completed_at)}
                      {c.difficulty != null ? ` · Zorluk: ${c.difficulty}/10` : ""}
                      {c.duration_minutes != null ? ` · ${c.duration_minutes} dk` : ""}
                    </Text>
                    {!!c.note && <Text style={styles.completionNote}>{c.note}</Text>}

                    {expanded && (
                      <View style={styles.completionDetailBox}>
                        {loadingDetailId === c.id ? (
                          <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.sm }} />
                        ) : details.length === 0 ? (
                          <Text style={styles.emptyText}>Set bazlı ağırlık/tekrar girişi yok.</Text>
                        ) : (
                          items
                            .filter((item) => byExercise.has(item.exercise_key))
                            .map((item) => (
                              <View key={item.id} style={styles.completionExerciseBlock}>
                                <Text style={styles.completionExerciseName}>{item.exercise_name}</Text>
                                {byExercise.get(item.exercise_key)!.map((m, i) => (
                                  <Text key={m.id} style={styles.completionSetLine}>
                                    Set {i + 1}: {m.weight_kg != null ? `${m.weight_kg} kg` : "Vücut ağırlığı"} × {m.reps} tekrar
                                  </Text>
                                ))}
                              </View>
                            ))
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

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
  setItemBlock: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  setItemName: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: spacing.xs },
  setItemTarget: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  completeBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg,
  },
  completedBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg,
  },
  completedTitle: { color: colors.teal, fontSize: 14, fontWeight: "800", marginBottom: 4 },
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
  completionRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  completionName: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  chevronSmall: { color: colors.muted, fontSize: 11 },
  completionDate: { color: colors.muted, fontSize: 11 },
  completionNote: { color: colors.ink, fontSize: 12, marginTop: 4, fontStyle: "italic" },
  completionDetailBox: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm },
  completionExerciseBlock: { marginBottom: spacing.sm },
  completionExerciseName: { color: colors.violet, fontSize: 12, fontWeight: "800", marginBottom: 2 },
  completionSetLine: { color: colors.ink, fontSize: 12, marginLeft: spacing.xs },
  deleteButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.xl,
  },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
