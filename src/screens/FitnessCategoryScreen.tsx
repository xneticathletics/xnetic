import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getFitnessCategory } from "../lib/fitnessExercises";
import { listCustomExercisesByCategory, type CustomFitnessExercise } from "../lib/api/customFitnessExercises";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessCategory">;

type Row = { key: string; name: string; exerciseId?: string; isGlobal?: boolean; canEdit?: boolean };

export default function FitnessCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const { role, clubId } = useAuth();
  const meta = getFitnessCategory(category);

  const [customExercises, setCustomExercises] = useState<CustomFitnessExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (meta) navigation.setOptions({ title: meta.label });
  }, [meta, navigation]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setCustomExercises(await listCustomExercisesByCategory(category));
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Kategori bulunamadı.</Text>
      </View>
    );
  }

  const rows: Row[] = [
    ...meta.exercises.map((e) => ({ key: e.key, name: e.name })),
    ...customExercises.map((e) => ({
      key: `custom:${e.id}`,
      name: e.name,
      exerciseId: e.id,
      isGlobal: e.club_id === null,
      canEdit: e.club_id === null ? role === "super_admin" : e.club_id === clubId,
    })),
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.heroCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
        <Text style={styles.heroIcon}>{meta.icon}</Text>
        <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.heroSubtitle}>Bir egzersiz seç</Text>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginBottom: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={rows}
        keyExtractor={(e) => e.key}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("FitnessExerciseDetail", { exerciseKey: item.key })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              {item.isGlobal && <Text style={styles.globalBadge}>🌐 Genel (tüm kulüpler)</Text>}
            </View>
            <View style={styles.rowActions}>
              {item.canEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate("FitnessExerciseForm", { exerciseId: item.exerciseId })}
                >
                  <Text style={styles.editButtonText}>✏️ Düzenle</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.rowArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  error: { color: colors.coral, marginTop: spacing.xl, textAlign: "center" },
  heroCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg },
  heroIcon: { fontSize: 40, marginBottom: spacing.xs },
  heroTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  heroSubtitle: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: "center" },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  globalBadge: { color: colors.muted, fontSize: 10, marginTop: 2 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  editButton: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  editButtonText: { color: colors.violet, fontSize: 12, fontWeight: "700" },
  rowArrow: { color: colors.muted, fontSize: 18, fontWeight: "700" },
});
