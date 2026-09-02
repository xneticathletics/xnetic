import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getFitnessExercise, getFitnessCategory, type FitnessCategory } from "../lib/fitnessExercises";
import { getCustomExercise } from "../lib/api/customFitnessExercises";
import {
  listMeasurementsForAthleteExercise, createFitnessMeasurement, deleteFitnessMeasurement, type FitnessMeasurement,
} from "../lib/api/fitnessMeasurements";
import type { Athlete } from "../lib/api/athletes";
import AthletePickerModal from "../components/AthletePickerModal";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessExerciseDetail">;

const CUSTOM_PREFIX = "custom:";

type Resolved = { name: string; bodyweight: boolean; category: FitnessCategory; instructions: string | null };

// Egzersiz anahtarı ya sabit katalogdaki bir key (ör. "bench_press") ya da
// sonradan eklenmiş özel bir egzersizin "custom:<uuid>" şeklindeki anahtarı
// olabilir — ikisini de tek bir arayüzde çözer. Kulübün sonradan eklediği
// özel egzersizlerin (custom:) sabit bir açıklaması olmadığı için
// instructions bu durumda null döner.
async function resolveExercise(exerciseKey: string): Promise<Resolved | null> {
  if (exerciseKey.startsWith(CUSTOM_PREFIX)) {
    const id = exerciseKey.slice(CUSTOM_PREFIX.length);
    const ex = await getCustomExercise(id);
    if (!ex) return null;
    const category = getFitnessCategory(ex.category);
    if (!category) return null;
    return { name: ex.name, bodyweight: ex.bodyweight, category, instructions: null };
  }
  const found = getFitnessExercise(exerciseKey);
  if (!found) return null;
  return { name: found.exercise.name, bodyweight: !!found.exercise.bodyweight, category: found.category, instructions: found.exercise.instructions };
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function FitnessExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseKey } = route.params;
  const { handleFocus } = useKeyboardScroll();

  const [resolved, setResolved] = useState<Resolved | null | undefined>(undefined);

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [weight, setWeight] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [measuredAt, setMeasuredAt] = useState(todayKey());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı ölçümü iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<FitnessMeasurement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveExercise(exerciseKey).then((r) => {
      if (cancelled) return;
      setResolved(r);
      navigation.setOptions({ title: r?.name ?? "Egzersiz" });
    });
    return () => { cancelled = true; };
  }, [exerciseKey, navigation]);

  const loadHistory = useCallback(async (athleteId: string) => {
    setLoadingHistory(true);
    try {
      setHistory(await listMeasurementsForAthleteExercise(athleteId, exerciseKey));
    } catch (e: any) {
      setError(e.message ?? "Geçmiş yüklenemedi");
    } finally {
      setLoadingHistory(false);
    }
  }, [exerciseKey]);

  useFocusEffect(
    useCallback(() => {
      if (athlete) loadHistory(athlete.id);
    }, [athlete, loadHistory])
  );

  const handleSelectAthlete = (a: Athlete) => {
    setAthlete(a);
    setWeight("");
    setSets("");
    setReps("");
    setNotes("");
    setMeasuredAt(todayKey());
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!athlete || !resolved) return;
    const weightNum = weight.trim() ? Number(weight.trim().replace(",", ".")) : null;
    const setsNum = sets.trim() ? Number(sets.trim()) : null;
    const repsNum = reps.trim() ? Number(reps.trim()) : null;

    if (!resolved.bodyweight && weightNum == null) {
      return Alert.alert("Eksik bilgi", "Bir ağırlık değeri girmelisin.", [{ text: "Tamam" }]);
    }
    if (repsNum == null) {
      return Alert.alert("Eksik bilgi", "Tekrar sayısı girmelisin.", [{ text: "Tamam" }]);
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createFitnessMeasurement({
        athlete_id: athlete.id,
        exercise_key: exerciseKey,
        weight_kg: weightNum,
        sets: setsNum,
        reps: repsNum,
        measured_at: measuredAt,
        notes: notes.trim() || null,
      });
      setWeight("");
      setSets("");
      setReps("");
      setNotes("");
      await loadHistory(athlete.id);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = (m: FitnessMeasurement) => {
    Alert.alert(
      "Kaydı sil",
      `${formatDate(m.measured_at)} tarihli kaydı silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFitnessMeasurement(m.id);
              if (athlete) await loadHistory(athlete.id);
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (resolved === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  if (resolved === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Egzersiz bulunamadı.</Text>
      </View>
    );
  }

  const { name, bodyweight, category, instructions } = resolved;

  return (
    <View style={styles.container}>
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
      data={athlete ? history : []}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={
        <>
          <View style={[styles.headerCard, { backgroundColor: category.soft, borderColor: category.color }]}>
            <Text style={styles.headerIcon}>{category.icon}</Text>
            <Text style={[styles.headerTitle, { color: category.color }]}>{name}</Text>
            {bodyweight && <Text style={styles.headerNote}>Vücut ağırlığıyla — ağırlık isteğe bağlı</Text>}
          </View>

          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>Nasıl Yapılır?</Text>
              <TouchableOpacity style={styles.videoButton} onPress={() => setVideoModalVisible(true)}>
                <Text style={styles.videoButtonIcon}>🎥</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.instructionsText}>
              {instructions ?? "Bu hareket kulübün eklediği özel bir hareket — henüz bir açıklama girilmedi."}
            </Text>
          </View>

          <TouchableOpacity style={styles.athleteButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.athleteButtonLabel}>{athlete ? "Sporcu" : "Sporcu Ara"}</Text>
            <Text style={styles.athleteButtonValue}>{athlete ? athlete.full_name : "Seçmek için dokun"}</Text>
          </TouchableOpacity>

          {athlete && (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>{`Ağırlık (kg)${bodyweight ? " — isteğe bağlı" : " *"}`}</Text>
              <TextInput
                onFocus={handleFocus}
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Örn. 60"
                placeholderTextColor={colors.muted}
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.formLabel}>Set Sayısı</Text>
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
                  <Text style={styles.formLabel}>Tekrar Sayısı *</Text>
                  <TextInput
                    onFocus={handleFocus}
                    style={styles.input}
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                    placeholder="Örn. 10"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Tarih *</Text>
              <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
                <Text style={{ color: colors.ink }}>{formatDate(measuredAt)}</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>Not</Text>
              <TextInput
                onFocus={handleFocus}
                style={[styles.input, styles.inputMultiline]}
                value={notes}
                onChangeText={setNotes}
                placeholder="İsteğe bağlı not"
                placeholderTextColor={colors.muted}
                multiline
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: category.color }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>

              <Text style={styles.historyLabel}>
                {athlete.full_name} — Geçmiş Kayıtlar{loadingHistory ? "…" : ""}
              </Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        athlete && !loadingHistory ? <Text style={styles.empty}>Bu sporcu için henüz kayıt yok.</Text> : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.historyRow} onLongPress={() => handleDelete(item)}>
          <View>
            <Text style={styles.historyValue}>
              {item.weight_kg != null ? `${item.weight_kg} kg` : "Vücut ağırlığı"}
              {item.sets != null ? ` × ${item.sets} set` : ""}
              {item.reps != null ? ` × ${item.reps} tekrar` : ""}
            </Text>
            {!!item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
          </View>
          <Text style={styles.historyDate}>{formatDate(item.measured_at)}</Text>
        </TouchableOpacity>
      )}
    />

      <AthletePickerModal
        visible={pickerVisible}
        selectedId={athlete?.id ?? null}
        onSelect={handleSelectAthlete}
        onClose={() => setPickerVisible(false)}
      />

      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={measuredAt}
        onSelect={setMeasuredAt}
        onClose={() => setDatePickerVisible(false)}
      />

      <Modal visible={videoModalVisible} animationType="fade" transparent onRequestClose={() => setVideoModalVisible(false)}>
        <TouchableOpacity style={styles.videoOverlay} activeOpacity={1} onPress={() => setVideoModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.videoSheet} onPress={() => {}}>
            <Text style={styles.videoSheetIcon}>🎬</Text>
            <Text style={styles.videoSheetTitle}>Video Yakında</Text>
            <Text style={styles.videoSheetText}>
              "{name}" hareketinin nasıl yapıldığını gösteren video bu ekrana yakında eklenecek.
            </Text>
            <TouchableOpacity style={styles.videoSheetClose} onPress={() => setVideoModalVisible(false)}>
              <Text style={styles.videoSheetCloseText}>Kapat</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, textAlign: "center", marginTop: spacing.xl },
  headerCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  headerIcon: { fontSize: 36, marginBottom: spacing.xs },
  headerTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  headerNote: { color: colors.muted, fontSize: 11, marginTop: 4, fontStyle: "italic" },
  instructionsCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  instructionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  instructionsTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  videoButton: {
    width: 32, height: 32, borderRadius: radius.full, backgroundColor: `${colors.violet}22`,
    alignItems: "center", justifyContent: "center",
  },
  videoButtonIcon: { fontSize: 16 },
  instructionsText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  videoOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  videoSheet: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: "center", width: "100%", maxWidth: 340,
  },
  videoSheetIcon: { fontSize: 36, marginBottom: spacing.sm },
  videoSheetTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  videoSheetText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: spacing.lg },
  videoSheetClose: { backgroundColor: colors.violet, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 10 },
  videoSheetCloseText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  athleteButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  athleteButtonLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  athleteButtonValue: { color: colors.ink, fontSize: 15, fontWeight: "700", marginTop: 2 },
  formCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  formLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  rowItem: { flex: 1 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 56, textAlignVertical: "top" },
  errorText: { color: colors.coral, marginTop: spacing.sm },
  saveButton: { borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: spacing.md },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  historyLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: spacing.lg },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.md },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  historyValue: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  historyNotes: { color: colors.muted, fontSize: 11, marginTop: 2 },
  historyDate: { color: colors.muted, fontSize: 12 },
});
