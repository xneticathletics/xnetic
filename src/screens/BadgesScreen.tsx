import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { listMyBadges, BADGE_CATALOG, badgeVisualTier, type Badge } from "../lib/api/badges";

const TIER_COLOR: Record<"bronze" | "silver" | "gold", string> = {
  bronze: colors.coral,
  silver: colors.teal,
  gold: colors.yellow,
};

export default function BadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listMyBadges()
        .then((rows) => { if (!cancelled) setBadges(rows); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {badges.length === 0 ? (
        <Text style={styles.empty}>
          Henüz bir rozetin yok — antrenmanlara katıl, fitness çalışmalarını tamamla, Sosyal Alan'da paylaş, mesajlaş ve mağazadan alışveriş yap; rozetler kendiliğinden gelir!
        </Text>
      ) : (
        <View style={styles.grid}>
          {badges.map((b) => {
            const catalog = BADGE_CATALOG[b.badge_type];
            const tierColor = TIER_COLOR[badgeVisualTier(b)];
            return (
              <View key={b.id} style={[styles.card, { borderColor: tierColor }]}>
                <View style={[styles.iconBadge, { backgroundColor: `${tierColor}22`, borderColor: tierColor }]}>
                  <Text style={styles.icon}>{catalog.icon}</Text>
                </View>
                <Text style={[styles.title, { color: tierColor }]} numberOfLines={2}>{catalog.title(b.tier)}</Text>
                <Text style={styles.desc} numberOfLines={2}>{catalog.description(b.tier)}</Text>
                <Text style={styles.date}>{new Date(b.earned_at).toLocaleDateString("tr-TR")}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: {
    width: "47%", backgroundColor: colors.surface, borderWidth: 1.5, borderRadius: radius.lg,
    padding: spacing.md, alignItems: "center",
  },
  iconBadge: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2, marginBottom: spacing.sm,
    alignItems: "center", justifyContent: "center",
  },
  icon: { fontSize: 28 },
  title: { fontSize: 13, fontWeight: "800", textAlign: "center" },
  desc: { color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 4 },
  date: { color: colors.muted, fontSize: 10, marginTop: spacing.sm },
});
