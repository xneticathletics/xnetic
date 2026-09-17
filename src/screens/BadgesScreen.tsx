import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { listMyBadges, BADGE_CATALOG, BADGE_TIER_COLOR, badgeVisualTier, badgeIconSize, badgeGlowStyle, type Badge, type AutoBadgeType, type TierThresholds } from "../lib/api/badges";
import { listBadgeTierSettings } from "../lib/api/badgeTierSettings";

const BASE_ICON_SIZE = 56;

export default function BadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [clubTiers, setClubTiers] = useState<Partial<Record<AutoBadgeType, TierThresholds>>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([listMyBadges(), listBadgeTierSettings()])
        .then(([rows, tiers]) => { if (!cancelled) { setBadges(rows); setClubTiers(tiers); } })
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
            const level = badgeVisualTier(b, clubTiers);
            const tierColor = BADGE_TIER_COLOR[level];
            const iconSize = badgeIconSize(level, BASE_ICON_SIZE);
            return (
              <View key={b.id} style={[styles.card, { borderColor: tierColor }]}>
                <View
                  style={[
                    styles.iconBadge,
                    { width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: `${tierColor}22`, borderColor: tierColor },
                    badgeGlowStyle(level),
                  ]}
                >
                  <Text style={{ fontSize: Math.round(iconSize * 0.5) }}>{catalog.icon}</Text>
                </View>
                <Text style={[styles.title, { color: tierColor }]} numberOfLines={2}>{catalog.title(level)}</Text>
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
  iconBadge: { borderWidth: 2, marginBottom: spacing.sm, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontWeight: "800", textAlign: "center" },
  desc: { color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 4 },
  date: { color: colors.muted, fontSize: 10, marginTop: spacing.sm },
});
