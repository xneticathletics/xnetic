import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllMeasurementsForAthlete, type PerformanceMeasurement } from "../lib/api/performanceMeasurements";
import { getPerformanceCategory } from "../lib/performanceTests";
import { getCustomTestsByIds, type CustomPerformanceTest } from "../lib/api/customPerformanceTests";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "AthletePerformanceView">;

const CUSTOM_PREFIX = "custom:";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// En son iki ölçüm arasındaki artış/azalış oranı — testin "iyi" yönü
// (ör. süratte düşük süre mi iyi, sıçramada yüksek değer mi iyi) elimizde
// olmadığı için burada bir yargı YOK, sadece ham değişim yüzdesi.
type Trend = { pct: number; dir: "up" | "down" };
function computeTrend(items: PerformanceMeasurement[]): Trend | null {
  if (items.length < 2) return null;
  const latest = items[0].value;
  const previous = items[1].value;
  if (previous === 0) return null;
  const pct = ((latest - previous) / Math.abs(previous)) * 100;
  if (pct === 0) return null;
  return { pct: Math.round(Math.abs(pct) * 10) / 10, dir: pct > 0 ? "up" : "down" };
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

function resolveGroup(
  testKey: string,
  items: PerformanceMeasurement[],
  customById: Map<string, CustomPerformanceTest>
): Group | null {
  if (!testKey.startsWith(CUSTOM_PREFIX)) return null;
  const test = customById.get(testKey.slice(CUSTOM_PREFIX.length));
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
  const { role } = useAuth();
  const isStaff = role === "club_admin" || role === "coach";
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
          const customIds = Array.from(byKey.keys())
            .filter((k) => k.startsWith(CUSTOM_PREFIX))
            .map((k) => k.slice(CUSTOM_PREFIX.length));
          const customTests = await getCustomTestsByIds(customIds);
          const customById = new Map(customTests.map((t) => [t.id, t]));
          const resolved = Array.from(byKey.entries()).map(([testKey, items]) => resolveGroup(testKey, items, customById));
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
      {groups.length === 0 ? (
        <Text style={styles.empty}>Henüz kaydedilmiş bir ölçüm yok.</Text>
      ) : (
        <Text style={styles.summary}>{groups.length} test takip ediliyor</Text>
      )}

      {groups.map((g) => {
        const trend = computeTrend(g.items);
        const recent = g.items.slice(0, 6);
        const maxValue = Math.max(...recent.map((m) => m.value), 0);
        return (
          <TouchableOpacity
            key={g.testKey}
            style={[styles.card, { borderColor: g.categoryColor }]}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("PerformanceTestDetail", {
                testKey: g.testKey,
                athleteId,
                athleteName,
                readOnly: !isStaff,
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{g.categoryIcon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{g.name}</Text>
                <Text style={styles.cardCategory}>{g.categoryLabel}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.latestValue, { color: g.categoryColor }]}>
                  {g.items[0].value} <Text style={styles.latestUnit}>{g.unit}</Text>
                </Text>
                {trend && (
                  <View style={[styles.trendPill, { backgroundColor: trend.dir === "up" ? colors.tealSoft : colors.coralSoft }]}>
                    <Text style={[styles.trendPillText, { color: trend.dir === "up" ? colors.teal : colors.coral }]}>
                      {trend.dir === "up" ? "▲" : "▼"} %{trend.pct}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.historyTable}>
              {recent.map((m, index) => {
                const widthPct = maxValue > 0 ? Math.max(10, (m.value / maxValue) * 100) : 10;
                return (
                  <View key={m.id} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{formatDate(m.measured_at)}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${widthPct}%`, backgroundColor: index === 0 ? g.categoryColor : `${g.categoryColor}55` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.historyValue, index === 0 && { color: g.categoryColor, fontWeight: "800" }]}>
                      {m.value}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  summary: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  cardIcon: { fontSize: 26 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  cardCategory: { color: colors.muted, fontSize: 11, marginTop: 2 },
  latestValue: { fontSize: 20, fontWeight: "800" },
  latestUnit: { fontSize: 12, fontWeight: "700" },
  trendPill: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  trendPillText: { fontSize: 11, fontWeight: "800" },
  historyTable: { gap: 6 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  historyDate: { color: colors.muted, fontSize: 11, width: 64 },
  barTrack: { flex: 1, height: 10, borderRadius: radius.full, backgroundColor: colors.bg, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radius.full },
  historyValue: { color: colors.muted, fontSize: 12, fontWeight: "600", width: 44, textAlign: "right" },
});
