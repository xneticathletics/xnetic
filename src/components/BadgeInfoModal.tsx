import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { BADGE_CATALOG, BADGE_TIER_COLOR, badgeVisualTier, badgeIconSize, badgeGlowStyle, type Badge } from "../lib/api/badges";

const BASE_ICON_SIZE = 60;

// Kulüp adının altındaki rafta yerleşmiş bir rozete dokununca — küçük,
// konfetisiz bir bilgi kutusu (kullanıcı isteği: "rozetin ne olduğunu...
// kısa yaratıcı kelimeler"). Seviye burada da boyut+renk+glow ile ayırt
// ediliyor (bkz. badges.ts badgeIconSize/badgeGlowStyle).
export default function BadgeInfoModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const catalog = BADGE_CATALOG[badge.badge_type];
  const level = badgeVisualTier(badge);
  const tierColor = BADGE_TIER_COLOR[level];
  const iconSize = badgeIconSize(level, BASE_ICON_SIZE);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { borderColor: tierColor }]}>
          <View
            style={[
              styles.iconBadge,
              { width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: `${tierColor}22`, borderColor: tierColor },
              badgeGlowStyle(level),
            ]}
          >
            <Text style={{ fontSize: Math.round(iconSize * 0.5) }}>{catalog.icon}</Text>
          </View>
          <Text style={[styles.title, { color: tierColor }]}>{catalog.title(badge.tier)}</Text>
          <Text style={styles.desc}>{catalog.description(badge.tier)}</Text>
          <Text style={styles.date}>{new Date(badge.earned_at).toLocaleDateString("tr-TR")}</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(10,11,28,0.7)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: {
    width: "100%", maxWidth: 300, backgroundColor: colors.surface, borderWidth: 1.5, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: "center",
  },
  iconBadge: { borderWidth: 2, marginBottom: spacing.sm, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  desc: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 17 },
  date: { color: colors.muted, fontSize: 10, marginTop: spacing.sm },
});
