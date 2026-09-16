import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllMeasurementsForAthlete, type FitnessMeasurement } from "../lib/api/fitnessMeasurements";
import { listAllCompletionsForAthlete, type FitnessProgramCompletion } from "../lib/api/fitnessPrograms";
import { listMyIndividualPrograms, type IndividualFitnessProgram } from "../lib/api/individualFitnessPrograms";
import { getFitnessExercise, getFitnessCategory } from "../lib/fitnessExercises";
import { getCustomExercisesByIds, type CustomFitnessExercise } from "../lib/api/customFitnessExercises";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteFitnessView">;

const CUSTOM_PREFIX = "custom:";

type SessionRecord = {
  measurement: FitnessMeasurement;
  name: string;
  color: string;
  icon: string;
};

// measured_at zaten saat içermeyen düz bir tarih (bkz. todayKey()) —
// bu yüzden aynı tarihte girilen tüm hareketler doğrudan "aynı antrenman"
// anlamına geliyor, ayrı bir training_session bağlantısına gerek yok.
type SessionGroup = {
  dateKey: string;
  records: SessionRecord[];
  // O güne ait TÜM kayıtlar AYNI bireysel programdan geliyorsa (yaygın
  // durum — bir program sayfasından kaydedilen ölçümler hep birlikte
  // girilir) programın adı; karışık/hiç yoksa null (bkz. individual_
  // program_id, migration 20260916200000).
  programName: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function resolveExercise(
  exerciseKey: string,
  customById: Map<string, CustomFitnessExercise>
): { name: string; color: string; icon: string } | null {
  if (exerciseKey.startsWith(CUSTOM_PREFIX)) {
    const ex = customById.get(exerciseKey.slice(CUSTOM_PREFIX.length));
    if (!ex) return null;
    const category = getFitnessCategory(ex.category);
    if (!category) return null;
    return { name: ex.name, color: category.color, icon: category.icon };
  }
  const found = getFitnessExercise(exerciseKey);
  if (!found) return null;
  return { name: found.exercise.name, color: found.category.color, icon: found.category.icon };
}

export default function AthleteFitnessViewScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  // En son antrenman varsayılan olarak açık gelsin, geri kalanı katlı —
  // her satıra tek tek dokunmadan en güncel çalışmayı hemen görebilsin diye.
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [completions, setCompletions] = useState<FitnessProgramCompletion[]>([]);
  // Bireysel program bölümü SADECE bu sporcunun en az bir programı varsa
  // gösteriliyor — hiç oluşturmamış bir sporcunun profilinde boş bir
  // bölüm göstermeye gerek yok (kullanıcı kararı).
  const [individualPrograms, setIndividualPrograms] = useState<IndividualFitnessProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleDate = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: `${athleteName} — Egzersizler` });
      let cancelled = false;
      setLoading(true);
      (async () => {
        try {
          const [all, allCompletions, ownPrograms] = await Promise.all([
            listAllMeasurementsForAthlete(athleteId),
            listAllCompletionsForAthlete(athleteId),
            listMyIndividualPrograms(athleteId),
          ]);
          const customIds = Array.from(new Set(all.map((m) => m.exercise_key)))
            .filter((k) => k.startsWith(CUSTOM_PREFIX))
            .map((k) => k.slice(CUSTOM_PREFIX.length));
          const customExercises = await getCustomExercisesByIds(customIds);
          const customById = new Map(customExercises.map((ex) => [ex.id, ex]));

          // Hareket bazlı değil, ANTRENMAN (gün) bazlı grupluyoruz —
          // measured_at zaten saatsiz düz bir tarih, aynı tarihteki tüm
          // kayıtlar aynı antrenmanın hareketleri sayılıyor.
          const programNameById = new Map(ownPrograms.map((p) => [p.id, p.name]));
          const byDate = new Map<string, SessionRecord[]>();
          const programIdsByDate = new Map<string, Set<string | null>>();
          all.forEach((m) => {
            const info = resolveExercise(m.exercise_key, customById);
            if (!info) return;
            const list = byDate.get(m.measured_at) ?? [];
            list.push({ measurement: m, ...info });
            byDate.set(m.measured_at, list);
            const idsForDate = programIdsByDate.get(m.measured_at) ?? new Set<string | null>();
            idsForDate.add(m.individual_program_id);
            programIdsByDate.set(m.measured_at, idsForDate);
          });
          const sortedGroups = Array.from(byDate.entries())
            .map(([dateKey, records]) => {
              const ids = Array.from(programIdsByDate.get(dateKey) ?? []);
              const programName =
                ids.length === 1 && ids[0] ? programNameById.get(ids[0]) ?? null : null;
              return { dateKey, records, programName };
            })
            .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

          if (!cancelled) {
            setSessionGroups(sortedGroups);
            setExpandedDates(new Set(sortedGroups.length > 0 ? [sortedGroups[0].dateKey] : []));
            setCompletions(allCompletions);
            setIndividualPrograms(ownPrograms);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [athleteId, athleteName])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {individualPrograms.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Bireysel Program</Text>
          {individualPrograms.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, { borderColor: colors.violet }]}
              onPress={() => navigation.navigate("IndividualFitnessProgramDetail", { programId: p.id, athleteId, athleteName })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📝</Text>
                <Text style={styles.cardTitle}>{p.name}</Text>
              </View>
              <Text style={styles.completionMeta}>{new Date(p.created_at).toLocaleDateString("tr-TR")}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, individualPrograms.length > 0 && { marginTop: spacing.lg }]}>Tamamlanan Grup Programları</Text>
      {completions.length === 0 ? (
        <Text style={styles.empty}>Henüz tamamlandı olarak işaretlenmiş bir program yok.</Text>
      ) : (
        completions.map((c) => (
          <View key={c.id} style={[styles.card, { borderColor: colors.teal }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>✓</Text>
              <Text style={styles.cardTitle}>{c.fitness_programs?.name ?? "Program"}</Text>
            </View>
            <Text style={styles.completionMeta}>
              {formatDateTime(c.completed_at)}
              {c.difficulty != null ? ` · Zorluk: ${c.difficulty}/10` : ""}
              {c.duration_minutes != null ? ` · ${c.duration_minutes} dk` : ""}
            </Text>
            {!!c.note && <Text style={styles.completionNote}>{c.note}</Text>}
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Egzersiz Geçmişi</Text>
      {sessionGroups.length === 0 && <Text style={styles.empty}>Henüz kaydedilmiş bir çalışma kaydı yok.</Text>}

      {sessionGroups.map((s) => {
        const isExpanded = expandedDates.has(s.dateKey);
        return (
          <View key={s.dateKey} style={styles.sessionCard}>
            <TouchableOpacity
              style={styles.sessionHeader}
              onPress={() => toggleDate(s.dateKey)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              accessibilityLabel={`${formatDate(s.dateKey)} antrenmanı, ${s.records.length} hareket`}
            >
              <View>
                <Text style={styles.sessionDate}>
                  {s.programName ? `${s.programName} — ${formatDate(s.dateKey)}` : formatDate(s.dateKey)}
                </Text>
                <Text style={styles.sessionMeta}>{s.records.length} hareket</Text>
              </View>
              <Text style={styles.sessionChevron}>{isExpanded ? "▾" : "▸"}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.sessionBody}>
                {s.records.map((r) => (
                  <View key={r.measurement.id} style={styles.historyRow}>
                    <View style={styles.historyLabel}>
                      <Text style={styles.historyIcon}>{r.icon}</Text>
                      <Text style={styles.historyValue} numberOfLines={1}>{r.name}</Text>
                    </View>
                    <Text style={styles.historyDetail} numberOfLines={1}>
                      {r.measurement.weight_kg != null ? `${r.measurement.weight_kg} kg` : "Vücut ağırlığı"}
                      {r.measurement.sets != null ? ` × ${r.measurement.sets} set` : ""}
                      {r.measurement.reps != null ? ` × ${r.measurement.reps} tekrar` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.md, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  cardIcon: { fontSize: 22 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  completionMeta: { color: colors.muted, fontSize: 11 },
  completionNote: { color: colors.ink, fontSize: 12, marginTop: spacing.xs, fontStyle: "italic" },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 8,
  },
  historyLabel: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  historyIcon: { fontSize: 14 },
  historyValue: { color: colors.ink, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  historyDetail: { color: colors.muted, fontSize: 12, flexShrink: 0 },
  // "Egzersiz Geçmişi" artık hareket başına değil, ANTRENMAN (gün) başına
  // bir akordeon — tıklanınca içerik aşağı doğru açılıyor.
  sessionCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    marginBottom: spacing.sm, overflow: "hidden",
  },
  sessionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md,
  },
  sessionDate: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  sessionMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  sessionChevron: { color: colors.yellow, fontSize: 16, fontWeight: "700" },
  sessionBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});
