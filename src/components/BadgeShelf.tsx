import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { BADGE_TIER_COLOR, badgeIconSize, badgeGlowStyle, type AnyBadge } from "../lib/api/badges";

const BASE_CHIP_SIZE = 28;

// Kulüp adının hemen altında, sola hizalı küçük ikon rafı — kazandıkça
// buraya bir tane daha eklenir (kullanıcı isteği: "aldıkça orası dolacak").
// Duyurular'ın üstünde ayrı bir kutu YOK artık, sadece bu satır. Seviye
// sadece renkle değil BOYUTLA da fark ediliyor (kullanıcı isteği) — gold
// ayrıca hafif parlıyor. AnyBadge sayesinde sabit VE özel (admin tanımlı)
// rozetler aynı rafta karışık gösterilebiliyor.
export default function BadgeShelf({ badges, onSelect }: { badges: AnyBadge[]; onSelect: (badge: AnyBadge) => void }) {
  if (badges.length === 0) return null;
  return (
    <View style={styles.row}>
      {badges.map((b) => {
        const tierColor = BADGE_TIER_COLOR[b.visualTier];
        const size = badgeIconSize(b.visualTier, BASE_CHIP_SIZE);
        return (
          <TouchableOpacity
            key={b.id}
            onPress={() => onSelect(b)}
            style={[
              styles.chip,
              { width: size, height: size, borderRadius: size / 2, borderColor: tierColor, backgroundColor: `${tierColor}1a` },
              badgeGlowStyle(b.visualTier),
            ]}
          >
            {b.iconIsImage ? (
              <Image source={{ uri: b.icon }} style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }} />
            ) : (
              <Text style={{ fontSize: Math.round(size * 0.46) }}>{b.icon}</Text>
            )}
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
