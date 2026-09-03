import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getPerformanceCategory } from "../lib/performanceTests";
import { listTestsByCategory, type CustomPerformanceTest } from "../lib/api/customPerformanceTests";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "PerformanceCategory">;

type Row = {
  key: string; name: string; unit: string; equipment: string | null;
  testId: string; sourceLabel?: string; canEdit: boolean;
};

export default function PerformanceCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const { role, clubId } = useAuth();
  const meta = getPerformanceCategory(category);

  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
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
      setTests(await listTestsByCategory(category));
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

  // "Global" / hangi kulübe ait olduğu etiketi SADECE Süper Admin'e
  // gösterilir — bkz. FitnessCategoryScreen.tsx'teki aynı mantık.
  const rows: Row[] = tests.map((t) => ({
    key: `custom:${t.id}`,
    name: t.name,
    unit: t.unit,
    equipment: t.equipment,
    testId: t.id,
    sourceLabel: role !== "super_admin" ? undefined : t.club_id === null ? "🌐 Global (Platform)" : `🏢 ${t.clubs?.name ?? "Bir kulüp"}`,
    canEdit: t.club_id === null ? role === "super_admin" : t.club_id === clubId,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.heroCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
        <Text style={styles.heroIcon}>{meta.icon}</Text>
        <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.heroSubtitle}>Kolaydan zora sıralı — bir test seç</Text>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginBottom: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={rows}
        keyExtractor={(t) => t.key}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.error}>Bu kategoride henüz test yok.</Text> : null}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("PerformanceTestDetail", { testKey: item.key })}
          >
            <View style={[styles.rowIndex, { backgroundColor: meta.soft }]}>
              <Text style={[styles.rowIndexText, { color: meta.color }]}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              {!!item.equipment && <Text style={styles.rowEquipment}>🔧 {item.equipment}</Text>}
              {!!item.sourceLabel && <Text style={styles.globalBadge}>{item.sourceLabel}</Text>}
            </View>
            {item.canEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("PerformanceTestForm", { testId: item.testId })}
              >
                <Text style={styles.editButtonText}>✏️ Düzenle</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.rowUnit, { color: meta.color }]}>{item.unit}</Text>
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
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowIndex: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  rowIndexText: { fontSize: 12, fontWeight: "800" },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowEquipment: { color: colors.muted, fontSize: 11, marginTop: 2 },
  globalBadge: { color: colors.muted, fontSize: 10, marginTop: 2 },
  editButton: { paddingHorizontal: spacing.xs, paddingVertical: 4 },
  editButtonText: { color: colors.violet, fontSize: 11, fontWeight: "700" },
  rowUnit: { fontSize: 12, fontWeight: "700" },
});
