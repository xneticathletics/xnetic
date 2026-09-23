import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listClubBadgeHolders, BADGE_CATALOG, BADGE_TIER_COLOR, badgeVisualTier, badgeIconSize, badgeGlowStyle,
  type BadgeHolder, type AutoBadgeType, type TierThresholds,
} from "../lib/api/badges";
import { listBadgeTierSettings } from "../lib/api/badgeTierSettings";
import Avatar from "../components/Avatar";

const BADGE_ICON_SIZE = 34;

// Kimin hangi rozetleri olduğunu gösteren yönetim ekranı. Kimin göründüğünü
// RLS belirliyor (badges_select): kulüp yöneticisi kulübün tamamını,
// koordinatör kendi branşını, antrenör kendi gruplarındaki sporcuları görür.
export default function BadgeHoldersScreen() {
  const [holders, setHolders] = useState<BadgeHolder[]>([]);
  const [clubTiers, setClubTiers] = useState<Partial<Record<AutoBadgeType, TierThresholds>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const [rows, tiers] = await Promise.all([listClubBadgeHolders(), listBadgeTierSettings()]);
      setHolders(rows);
      setClubTiers(tiers);
    } catch (e: any) {
      setError(e.message ?? "Rozetler yüklenemedi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return holders;
    return holders.filter((h) => h.name.toLocaleLowerCase("tr").includes(q));
  }, [holders, query]);

  const totalBadges = useMemo(() => holders.reduce((sum, h) => sum + h.badges.length, 0), [holders]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        {holders.length} kişi · toplam {totalBadges} rozet
      </Text>

      <TextInput
        style={styles.search}
        placeholder="İsimle ara..."
        placeholderTextColor={colors.muted}
        accessibilityLabel="Rozet sahibi ara"
        value={query}
        onChangeText={setQuery}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(h) => h.key}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? "Eşleşen kişi bulunamadı." : "Henüz kimse rozet kazanmamış."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar
                photoUrl={item.photoUrl}
                name={item.name}
                kind={item.kind === "athlete" ? "athlete" : "coach"}
                size={38}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.count}>{item.badges.length} rozet</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              {item.badges.map((b) => {
                const catalog = BADGE_CATALOG[b.badge_type];
                const level = badgeVisualTier(b, clubTiers);
                const tierColor = BADGE_TIER_COLOR[level];
                const size = badgeIconSize(level, BADGE_ICON_SIZE);
                return (
                  <View key={b.id} style={styles.badgeItem}>
                    <View
                      style={[
                        styles.badgeIcon,
                        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${tierColor}22`, borderColor: tierColor },
                        badgeGlowStyle(level),
                      ]}
                    >
                      <Text style={{ fontSize: Math.round(size * 0.5) }}>{catalog.icon}</Text>
                    </View>
                    <Text style={[styles.badgeLabel, { color: tierColor }]} numberOfLines={2}>
                      {catalog.title(level)}
                    </Text>
                    <Text style={styles.badgeDate}>{new Date(b.earned_at).toLocaleDateString("tr-TR")}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  summary: { color: colors.muted, fontSize: 12, fontWeight: "600", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
    marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md,
  },
  error: { color: colors.coral, textAlign: "center", marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  name: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  count: { color: colors.muted, fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  badgeItem: { width: 82, alignItems: "center" },
  badgeIcon: { borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  badgeLabel: { fontSize: 10, fontWeight: "800", textAlign: "center" },
  badgeDate: { color: colors.muted, fontSize: 9, marginTop: 2 },
});
