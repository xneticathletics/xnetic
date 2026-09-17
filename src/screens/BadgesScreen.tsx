import React, { useCallback, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { listMyBadges, fromBuiltIn, BADGE_TIER_COLOR, badgeIconSize, badgeGlowStyle, type AnyBadge } from "../lib/api/badges";
import { listMyCustomBadgesEarned, normalizeCustomEarnedRows } from "../lib/api/badgeTemplates";
import { getCurrentAppUserId } from "../lib/api/currentUser";
import { getMyAthletes } from "../lib/api/myAthletes";

const BASE_ICON_SIZE = 56;

export default function BadgesScreen() {
  const [badges, setBadges] = useState<AnyBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      (async () => {
        try {
          const [userId, myAthletes, builtIn] = await Promise.all([getCurrentAppUserId(), getMyAthletes(), listMyBadges()]);
          const athleteIds = myAthletes.map((a) => a.id);
          const customRows = await listMyCustomBadgesEarned(athleteIds, userId);
          const custom = await normalizeCustomEarnedRows(customRows);
          const merged = [...builtIn.map(fromBuiltIn), ...custom].sort((a, b) => b.earned_at.localeCompare(a.earned_at));
          if (!cancelled) setBadges(merged);
        } catch {
          if (!cancelled) setBadges([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
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
            const tierColor = BADGE_TIER_COLOR[b.visualTier];
            const iconSize = badgeIconSize(b.visualTier, BASE_ICON_SIZE);
            return (
              <View key={b.id} style={[styles.card, { borderColor: tierColor }]}>
                <View
                  style={[
                    styles.iconBadge,
                    { width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: `${tierColor}22`, borderColor: tierColor },
                    badgeGlowStyle(b.visualTier),
                  ]}
                >
                  {b.iconIsImage ? (
                    <Image source={{ uri: b.icon }} style={{ width: iconSize - 10, height: iconSize - 10, borderRadius: (iconSize - 10) / 2 }} />
                  ) : (
                    <Text style={{ fontSize: Math.round(iconSize * 0.5) }}>{b.icon}</Text>
                  )}
                </View>
                <Text style={[styles.title, { color: tierColor }]} numberOfLines={2}>{b.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>{b.description}</Text>
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
