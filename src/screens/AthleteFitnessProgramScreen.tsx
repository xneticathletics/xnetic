import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { getAthlete } from "../lib/api/athletes";
import { listProgramsForGroup, type FitnessProgram } from "../lib/api/fitnessPrograms";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteFitnessProgram">;

// Sporcu/veli tarafında SALT OKUNUR program listesi — sadece o sporcunun
// kendi grubuna gönderilen programları gösterir (coach/admin tarafındaki
// FitnessProgramScreen'in TÜM kulübü listeleyen halinden farklı olarak).
export default function AthleteFitnessProgramScreen({ route, navigation }: Props) {
  const { athleteId } = route.params;
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      getAthlete(athleteId)
        .then((athlete) => {
          if (cancelled) return [];
          if (!athlete?.group_id) return [];
          return listProgramsForGroup(athlete.group_id);
        })
        .then((data) => { if (!cancelled) setPrograms(data ?? []); })
        .catch((e) => { if (!cancelled) setError(e.message ?? "Programlar yüklenemedi"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [athleteId])
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && programs.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📋</Text>
          <Text style={styles.placeholderTitle}>Henüz Program Yok</Text>
          <Text style={styles.placeholderText}>Antrenörün henüz bir çalışma programı yayınlamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("FitnessProgramDetail", { programId: item.id, athleteId })}
            >
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString("tr-TR")}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  placeholder: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginTop: spacing.xl,
  },
  placeholderIcon: { fontSize: 36, marginBottom: spacing.sm },
  placeholderTitle: { color: colors.yellow, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  placeholderText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  cardDate: { color: colors.muted, fontSize: 11 },
});
