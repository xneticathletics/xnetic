import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BADGE_CATALOG, BADGE_TIER_COLOR, badgeVisualTier, badgeIconSize, badgeGlowStyle, type Badge, type AutoBadgeType, type TierThresholds } from "../lib/api/badges";

const BASE_CHIP_SIZE = 28;

// Kulüp adının hemen altında, sola hizalı küçük ikon rafı — kazandıkça
// buraya bir tane daha eklenir (kullanıcı isteği: "aldıkça orası dolacak").
// Duyurular'ın üstünde ayrı bir kutu YOK artık, sadece bu satır. Seviye
// sadece renkle değil BOYUTLA da fark ediliyor (kullanıcı isteği) — gold
// ayrıca hafif parlıyor. clubTiers kulübün özelleştirdiği eşikler varsa
// (bkz. badgeTierSettings.ts) doğru seviyeyi hesaplamak için kullanılır.
export default function BadgeShelf({
  badges,
  onSelect,
  clubTiers,
}: {
  badges: Badge[];
  onSelect: (badge: Badge) => void;
  clubTiers?: Partial<Record<AutoBadgeType, TierThresholds>>;
}) {
  if (badges.length === 0) return null;
  return (
    <View style={styles.row}>
      {badges.map((b) => {
        const level = badgeVisualTier(b, clubTiers);
        const tierColor = BADGE_TIER_COLOR[level];
        const size = badgeIconSize(level, BASE_CHIP_SIZE);
        return (
          <TouchableOpacity
            key={b.id}
            onPress={() => onSelect(b)}
            style={[
              styles.chip,
              { width: size, height: size, borderRadius: size / 2, borderColor: tierColor, backgroundColor: `${tierColor}1a` },
              badgeGlowStyle(level),
            ]}
          >
            <Text style={{ fontSize: Math.round(size * 0.46) }}>{BADGE_CATALOG[b.badge_type].icon}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 },
  chip: { borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
