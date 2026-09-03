import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllMeasurementsForAthlete, type PerformanceMeasurement } from "../lib/api/performanceMeasurements";
import { getPerformanceCategory } from "../lib/performanceTests";
import { getCustomTest } from "../lib/api/customPerformanceTests";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthletePerformanceView">;

const CUSTOM_PREFIX = "custom:";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

type Group = {
  testKey: string;
  items: PerformanceMeasurement[];
  name: string;
  unit: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
};

async function resolveGroup(testKey: string, items: PerformanceMeasurement[]): Promise<Group | null> {
  if (!testKey.startsWith(CUSTOM_PREFIX)) return null;
  const test = await getCustomTest(testKey.slice(CUSTOM_PREFIX.length));
  if (!test) return null;
  const category = getPerformanceCategory(test.category);
  if (!category) return null;
  return {
    testKey, items, name: test.name, unit: test.unit,
    categoryLabel: category.label, categoryIcon: category.icon, categoryColor: category.color,
  };
}

export default function AthletePerformanceViewScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: `${athleteName} — Ölçümler` });
      let cancelled = false;
      setLoading(true);
      (async () => {
        try {
          const measurements = await listAllMeasurementsForAthlete(athleteId);
          const byKey = new Map<string, PerformanceMeasurement[]>();
          measurements.forEach((m) => {
            const list = byKey.get(m.test_key) ?? [];
            list.push(m);
            byKey.set(m.test_key, list);
          });
          const resolved = await Promise.all(
            Array.from(byKey.entries()).map(([testKey, items]) => resolveGroup(testKey, items))
          );
          const valid = resolved.filter((g): g is Group => !!g);
          valid.sort((a, b) => new Date(b.items[0].measured_at).getTime() - new Date(a.items[0].measured_at).getTime());
          if (!cancelled) setGroups(valid);
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
      {groups.length === 0 && <Text style={styles.empty}>Henüz kaydedilmiş bir ölçüm yok.</Text>}

      {groups.map((g) => (
        <View key={g.testKey} style={[styles.card, { borderColor: g.categoryColor }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{g.categoryIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{g.name}</Text>
              <Text style={styles.cardCategory}>{g.categoryLabel}</Text>
            </View>
            <Text style={[styles.latestValue, { color: g.categoryColor }]}>
              {g.items[0].value} {g.unit}
            </Text>
          </View>
          {g.items.slice(0, 5).map((m) => (
            <View key={m.id} style={styles.historyRow}>
              <Text style={styles.historyValue}>{m.value} {g.unit}</Text>
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
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  cardIcon: { fontSize: 24 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  cardCategory: { color: colors.muted, fontSize: 11, marginTop: 2 },
  latestValue: { fontSize: 16, fontWeight: "800" },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 6,
  },
  historyValue: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  historyDate: { color: colors.muted, fontSize: 12 },
});
