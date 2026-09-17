import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";
import { BADGE_CATALOG, badgeVisualTier, type Badge } from "../lib/api/badges";

const TIER_COLOR: Record<"bronze" | "silver" | "gold", string> = {
  bronze: colors.coral,
  silver: colors.teal,
  gold: colors.yellow,
};

// Kulüp adının hemen altında, sola hizalı küçük ikon rafı — kazandıkça
// buraya bir tane daha eklenir (kullanıcı isteği: "aldıkça orası dolacak").
// Duyurular'ın üstünde ayrı bir kutu YOK artık, sadece bu satır.
export default function BadgeShelf({ badges, onSelect }: { badges: Badge[]; onSelect: (badge: Badge) => void }) {
  if (badges.length === 0) return null;
  return (
    <View style={styles.row}>
      {badges.map((b) => {
        const tierColor = TIER_COLOR[badgeVisualTier(b)];
        return (
          <TouchableOpacity
            key={b.id}
            onPress={() => onSelect(b)}
            style={[styles.chip, { borderColor: tierColor, backgroundColor: `${tierColor}1a` }]}
          >
            <Text style={styles.icon}>{BADGE_CATALOG[b.badge_type].icon}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  icon: { fontSize: 13 },
});
