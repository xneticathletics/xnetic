import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { BADGE_TIER_COLOR, badgeIconSize, badgeGlowStyle, type AnyBadge } from "../lib/api/badges";

const BASE_ICON_SIZE = 60;

// Kulüp adının altındaki rafta yerleşmiş bir rozete dokununca — küçük,
// konfetisiz bir bilgi kutusu (kullanıcı isteği: "rozetin ne olduğunu...
// kısa yaratıcı kelimeler"). Seviye burada da boyut+renk+glow ile ayırt
// ediliyor (bkz. badges.ts badgeIconSize/badgeGlowStyle).
export default function BadgeInfoModal({ badge, onClose }: { badge: AnyBadge; onClose: () => void }) {
  const tierColor = BADGE_TIER_COLOR[badge.visualTier];
  const iconSize = badgeIconSize(badge.visualTier, BASE_ICON_SIZE);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { borderColor: tierColor }]}>
          <View
            style={[
              styles.iconBadge,
              { width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: `${tierColor}22`, borderColor: tierColor },
              badgeGlowStyle(badge.visualTier),
            ]}
          >
            {badge.iconIsImage ? (
              <Image source={{ uri: badge.icon }} style={{ width: iconSize - 12, height: iconSize - 12, borderRadius: (iconSize - 12) / 2 }} />
            ) : (
              <Text style={{ fontSize: Math.round(iconSize * 0.5) }}>{badge.icon}</Text>
            )}
          </View>
          <Text style={[styles.title, { color: tierColor }]}>{badge.title}</Text>
          <Text style={styles.desc}>{badge.description}</Text>
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
