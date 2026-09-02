import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listCheckinsForAthlete, type WellnessCheckin } from "../lib/api/wellnessCheckins";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteWellnessDetail">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function AthleteWellnessDetailScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const [history, setHistory] = useState<WellnessCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: athleteName });
  }, [athleteName, navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listCheckinsForAthlete(athleteId, 30)
        .then(setHistory)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [athleteId])
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={history}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bu sporcu henüz check-in yapmadı.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{formatDate(item.checkin_date)}</Text>
            <View style={styles.metricsRow}>
              {item.sleep_hours != null && <Text style={styles.metric}>🛌 {item.sleep_hours} sa</Text>}
              {item.sleep_quality != null && <Text style={styles.metric}>😴 Uyku: {item.sleep_quality}/5</Text>}
              {item.soreness != null && <Text style={styles.metric}>💪 Yorgunluk: {item.soreness}/5</Text>}
              {item.energy != null && <Text style={styles.metric}>⚡ Enerji: {item.energy}/5</Text>}
              {item.mood != null && <Text style={styles.metric}>🙂 Ruh Hali: {item.mood}/5</Text>}
              {item.resting_hr != null && <Text style={styles.metric}>❤️ {item.resting_hr} bpm</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  date: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { color: colors.muted, fontSize: 12 },
});
