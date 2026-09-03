import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllMeasurementsForAthlete, type FitnessMeasurement } from "../lib/api/fitnessMeasurements";
import { listAllCompletionsForAthlete, type FitnessProgramCompletion } from "../lib/api/fitnessPrograms";
import { getFitnessExercise, getFitnessCategory } from "../lib/fitnessExercises";
import { getCustomExercise } from "../lib/api/customFitnessExercises";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteFitnessView">;

const CUSTOM_PREFIX = "custom:";

type Group = {
  exerciseKey: string;
  name: string;
  color: string;
  icon: string;
  items: FitnessMeasurement[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function resolveExercise(exerciseKey: string): Promise<{ name: string; color: string; icon: string } | null> {
  if (exerciseKey.startsWith(CUSTOM_PREFIX)) {
    const id = exerciseKey.slice(CUSTOM_PREFIX.length);
    const ex = await getCustomExercise(id);
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [completions, setCompletions] = useState<FitnessProgramCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: `${athleteName} — Çalışma` });
      let cancelled = false;
      setLoading(true);
      (async () => {
        try {
          const [all, allCompletions] = await Promise.all([
            listAllMeasurementsForAthlete(athleteId),
            listAllCompletionsForAthlete(athleteId),
          ]);
          const byKey = new Map<string, FitnessMeasurement[]>();
          all.forEach((m) => {
            const list = byKey.get(m.exercise_key) ?? [];
            list.push(m);
            byKey.set(m.exercise_key, list);
          });
          const resolved = await Promise.all(
            Array.from(byKey.entries()).map(async ([exerciseKey, items]) => {
              const info = await resolveExercise(exerciseKey);
              if (!info) return null;
              return { exerciseKey, items, ...info };
            })
          );
          const valid = resolved.filter((g): g is Group => !!g);
          valid.sort((a, b) => new Date(b.items[0].measured_at).getTime() - new Date(a.items[0].measured_at).getTime());
          if (!cancelled) {
            setGroups(valid);
            setCompletions(allCompletions);
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
      <Text style={styles.sectionTitle}>Tamamlanan Programlar</Text>
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
      {groups.length === 0 && <Text style={styles.empty}>Henüz kaydedilmiş bir çalışma kaydı yok.</Text>}

      {groups.map((g) => (
        <View key={g.exerciseKey} style={[styles.card, { borderColor: g.color }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{g.icon}</Text>
            <Text style={styles.cardTitle}>{g.name}</Text>
          </View>
          {g.items.slice(0, 5).map((m) => (
            <View key={m.id} style={styles.historyRow}>
              <Text style={styles.historyValue}>
                {m.weight_kg != null ? `${m.weight_kg} kg` : "Vücut ağırlığı"}
                {m.sets != null ? ` × ${m.sets} set` : ""}
                {m.reps != null ? ` × ${m.reps} tekrar` : ""}
              </Text>
              <Text style={styles.historyDate}>{formatDate(m.measured_at)}</Text>
            </View>
          ))}
        </View>
      ))}
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
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 6,
  },
  historyValue: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  historyDate: { color: colors.muted, fontSize: 12 },
});
