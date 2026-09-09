import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { listMyIndividualPrograms, type IndividualFitnessProgram } from "../lib/api/individualFitnessPrograms";

type Props = NativeStackScreenProps<HomeStackParamList, "IndividualFitnessProgramList">;

// Sporcunun kendi yazdığı, kulübün atamadığı programların listesi —
// AthleteFitnessProgramScreen'in (antrenörün yayınladığı program) kişisel
// karşılığı. Sadece sporcunun kendi girişinde görünür (bkz. AthleteDetailScreen).
export default function IndividualFitnessProgramListScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const [programs, setPrograms] = useState<IndividualFitnessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      listMyIndividualPrograms(athleteId)
        .then((data) => { if (!cancelled) setPrograms(data); })
        .catch((e) => { if (!cancelled) setError(e.message ?? "Programlar yüklenemedi"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [athleteId])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("IndividualFitnessProgramBuilder", { athleteId })}
      >
        <Text style={styles.addButtonText}>+ Yeni Program</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && programs.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📝</Text>
          <Text style={styles.placeholderTitle}>Henüz Bir Program Oluşturmadın</Text>
          <Text style={styles.placeholderText}>Kendi hareketlerini seçip bir program oluşturarak başla.</Text>
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("IndividualFitnessProgramDetail", { programId: item.id, athleteId, athleteName })
              }
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
  addButton: {
    backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 14,
    alignItems: "center", marginBottom: spacing.md,
  },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  placeholder: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginTop: spacing.xl,
  },
  placeholderIcon: { fontSize: 36, marginBottom: spacing.sm },
  placeholderTitle: { color: colors.violet, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  placeholderText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  cardDate: { color: colors.muted, fontSize: 11 },
});
