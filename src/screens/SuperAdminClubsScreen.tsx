import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllClubs, type ClubSummary } from "../lib/api/superAdmin";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminClubs">;

const STATUS_LABELS: Record<string, string> = {
  mock_paid: "Test Ödemesi",
  active: "Aktif",
  cancelled: "İptal Edildi",
  past_due: "Ödeme Gecikti",
};

const PERIOD_LABELS: Record<string, string> = { monthly: "Aylık", yearly: "Yıllık" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function SuperAdminClubsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listAllClubs()
        .then((data) => { if (!cancelled) setClubs(data); })
        .catch((e) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Platformdaki tüm kulüpler ({clubs.length})</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={clubs}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz kulüp yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDate}>Katılım: {formatDate(item.created_at)}</Text>
            {item.subscription ? (
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{PERIOD_LABELS[item.subscription.billing_period] ?? item.subscription.billing_period}</Text>
                </View>
                <View style={[styles.badge, styles.badgeStatus]}>
                  <Text style={styles.badgeText}>{STATUS_LABELS[item.subscription.status] ?? item.subscription.status}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noSub}>Abonelik kaydı yok</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  cardDate: { color: colors.muted, fontSize: 11, marginTop: 2, marginBottom: spacing.xs },
  badgeRow: { flexDirection: "row", gap: spacing.xs },
  badge: { backgroundColor: `${colors.violet}22`, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeStatus: { backgroundColor: `${colors.teal}22` },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  noSub: { color: colors.coral, fontSize: 11, fontStyle: "italic" },
});
