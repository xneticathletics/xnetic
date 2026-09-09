import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { listMyIndividualPrograms, type IndividualFitnessProgram } from "../lib/api/individualFitnessPrograms";
import { getAthlete } from "../lib/api/athletes";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "IndividualFitnessProgramList">;

// Sporcunun kendi yazdığı, kulübün atamadığı programların listesi —
// AthleteFitnessProgramScreen'in (antrenörün yayınladığı program) kişisel
// karşılığı. Sporcu kendi girişinde tam erişimle (oluştur/gir), antrenör/
// admin ise SALT OKUNUR görüntüleme için buraya gelir (bkz. AthleteDetailScreen'deki
// "Bireysel Program" aksiyonu) — RLS zaten coach/admin'e sadece SELECT veriyor.
export default function IndividualFitnessProgramListScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const { role } = useAuth();
  const isStaff = role === "club_admin" || role === "coach";
  const [programs, setPrograms] = useState<IndividualFitnessProgram[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      Promise.all([
        listMyIndividualPrograms(athleteId),
        isStaff ? getAthlete(athleteId) : Promise.resolve(null),
      ])
        .then(([data, athlete]) => {
          if (cancelled) return;
          setPrograms(data);
          setBranch(athlete?.groups?.branch ?? null);
        })
        .catch((e) => { if (!cancelled) setError(e.message ?? "Programlar yüklenemedi"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [athleteId, isStaff])
  );

  return (
    <View style={styles.container}>
      {isStaff && (
        <View style={styles.staffHeader}>
          <Text style={styles.staffHeaderName}>{athleteName}</Text>
          {!!branch && <Text style={styles.staffHeaderBranch}>{branch}</Text>}
        </View>
      )}

      {!isStaff && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("IndividualFitnessProgramBuilder", { athleteId })}
        >
          <Text style={styles.addButtonText}>+ Yeni Program</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && programs.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📝</Text>
          <Text style={styles.placeholderTitle}>
            {isStaff ? "Henüz Bir Program Yok" : "Henüz Bir Program Oluşturmadın"}
          </Text>
          <Text style={styles.placeholderText}>
            {isStaff
              ? "Bu sporcu henüz kendi bireysel programını oluşturmadı."
              : "Kendi hareketlerini seçip bir program oluşturarak başla."}
          </Text>
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
  staffHeader: { marginBottom: spacing.md },
  staffHeaderName: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  staffHeaderBranch: { color: colors.violet, fontSize: 13, fontWeight: "600", marginTop: 2 },
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
