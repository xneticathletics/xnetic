import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listInjuries, type Injury } from "../lib/api/injuries";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteInjuries">;

export default function AthleteInjuriesScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setInjuries(await listInjuries(athleteId));
    } catch (e: any) {
      setError(e.message ?? "Sakatlık geçmişi yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [athleteId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{athleteName}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("InjuryForm", { athleteId, athleteName })}
        >
          <Text style={styles.addButtonText}>+ Bildir</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Sakatlık Geçmişi</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={injuries}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Kayıtlı sakatlık yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.rowType}>{item.injury_type}</Text>
              <Text style={styles.rowDate}>{item.injury_date}</Text>
            </View>
            {!!item.expected_return && (
              <Text style={styles.rowReturn}>Tahmini dönüş: {item.expected_return}</Text>
            )}
            {!!item.note && <Text style={styles.rowNote}>{item.note}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.md },
  addButton: { backgroundColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between" },
  rowType: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  rowDate: { color: colors.muted, fontSize: 12 },
  rowReturn: { color: colors.teal, fontSize: 12, marginTop: 4, fontWeight: "600" },
  rowNote: { color: colors.muted, fontSize: 13, marginTop: 6 },
});
