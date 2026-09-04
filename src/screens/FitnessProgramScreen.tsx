import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { listPrograms, type FitnessProgram } from "../lib/api/fitnessPrograms";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessProgram">;

export default function FitnessProgramScreen({ navigation }: Props) {
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listPrograms()
        .then((data) => { if (!cancelled) setPrograms(data); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("FitnessProgramBuilder")}>
          <Text style={styles.addButtonText}>+ Program Ekle</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      ) : programs.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📋</Text>
          <Text style={styles.placeholderTitle}>Henüz Program Yok</Text>
          <Text style={styles.placeholderText}>
            "+ Program Ekle" ile bir gruba özel çalışma programı oluşturup yayınlayabilirsin.
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
              onPress={() => navigation.navigate("FitnessProgramDetail", { programId: item.id })}
            >
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardGroup}>
                {item.groups
                  ? `${item.groups.name} · ${item.groups.branch}`
                  : item.fitness_groups
                  ? `🎯 ${item.fitness_groups.name} · ${item.fitness_groups.branch}`
                  : "Grup bulunamadı"}
              </Text>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString("tr-TR")}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.lg },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
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
  cardGroup: { color: colors.violet, fontSize: 12, fontWeight: "600", marginBottom: 2 },
  cardDate: { color: colors.muted, fontSize: 11 },
});
