import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getPlatformStats, type PlatformStats } from "../lib/api/superAdmin";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminReport">;

export default function SuperAdminReportScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getPlatformStats()
        .then((s) => { if (!cancelled) setStats(s); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={styles.container}>
      {loading || !stats ? (
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      ) : (
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.value}>{stats.totalClubs}</Text>
            <Text style={styles.label}>Toplam Kulüp</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{stats.activeSubscriptions}</Text>
            <Text style={styles.label}>Aktif Abonelik</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{stats.completedRevenueTry.toLocaleString("tr-TR")} ₺</Text>
            <Text style={styles.label}>Tamamlanan Gelir</Text>
          </View>
        </View>
      )}
      {!loading && stats && (
        <Text style={styles.note}>
          Bu rakam sadece gerçekten tamamlanmış (iyzico onaylı) ödemeleri sayar — test/mock ödemeler dahil değil. iyzico bağlanana kadar ₺0 görünmesi normaldir.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: {
    flexBasis: "30%", flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: "center",
  },
  value: { color: colors.yellow, fontSize: 26, fontWeight: "800" },
  label: { color: colors.muted, fontSize: 12, marginTop: spacing.xs, textAlign: "center" },
  note: { color: colors.muted, fontSize: 11, fontStyle: "italic", marginTop: spacing.md, textAlign: "center" },
});
