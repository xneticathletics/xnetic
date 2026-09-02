import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllMeasurementsForAthlete, type PerformanceMeasurement } from "../lib/api/performanceMeasurements";
import { getPerformanceTest } from "../lib/performanceTests";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthletePerformanceView">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function AthletePerformanceViewScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const [measurements, setMeasurements] = useState<PerformanceMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: `${athleteName} — Ölçümler` });
      let cancelled = false;
      setLoading(true);
      listAllMeasurementsForAthlete(athleteId)
        .then((data) => { if (!cancelled) setMeasurements(data); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [athleteId, athleteName])
  );

  const groupedByTest = useMemo(() => {
    const map = new Map<string, PerformanceMeasurement[]>();
    measurements.forEach((m) => {
      const list = map.get(m.test_key) ?? [];
      list.push(m);
      map.set(m.test_key, list);
    });
    return Array.from(map.entries())
      .map(([testKey, items]) => ({ testKey, items, found: getPerformanceTest(testKey) }))
      .filter((g) => g.found)
      .sort((a, b) => new Date(b.items[0].measured_at).getTime() - new Date(a.items[0].measured_at).getTime());
  }, [measurements]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {groupedByTest.length === 0 && <Text style={styles.empty}>Henüz kaydedilmiş bir ölçüm yok.</Text>}

      {groupedByTest.map(({ testKey, items, found }) => {
        const { test, category } = found!;
        return (
          <View key={testKey} style={[styles.card, { borderColor: category.color }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{category.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{test.name}</Text>
                <Text style={styles.cardCategory}>{category.label}</Text>
              </View>
              <Text style={[styles.latestValue, { color: category.color }]}>
                {items[0].value} {test.unit}
              </Text>
            </View>
            {items.slice(0, 5).map((m) => (
              <View key={m.id} style={styles.historyRow}>
                <Text style={styles.historyValue}>{m.value} {test.unit}</Text>
                <Text style={styles.historyDate}>{formatDate(m.measured_at)}</Text>
              </View>
            ))}
          </View>
        );
      })}
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
