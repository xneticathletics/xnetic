import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export type FilterChipOption = { key: string | null; label: string };

type Props = {
  options: FilterChipOption[];
  // undefined = henüz hiçbir seçenek seçilmedi (ör. Takvim'de branş henüz
  // seçilmeden önce) — bu durumda hiçbir çip aktif görünmez.
  activeKey: string | null | undefined;
  onSelect: (key: string | null) => void;
  // Bazı ekranlarda (ör. antrenör ödemeleri) filtre sarı yerine farklı bir
  // aksan renkle vurgulanıyor — varsayılan marka sarısı.
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
};

// Takvim ekranındaki branş/grup filtreleriyle aynı "track" görünümü —
// her çipin kendi çerçevesi yerine, ortak bir zemin (colors.surface)
// üzerinde duran haplar. Sporcular/Antrenörler/Finans gibi liste filtreli
// TÜM ekranlarda aynı görsel dilin kullanılması için paylaşılan bileşen —
// tek yerden değiştirilince hepsi birden güncellenir.
export default function FilterChipRow({ options, activeKey, onSelect, activeColor = colors.yellow, style }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.row, style]}
      contentContainerStyle={styles.rowContent}
    >
      {options.map((opt) => {
        const active = opt.key === activeKey;
        return (
          <TouchableOpacity
            key={opt.key ?? "__all__"}
            style={[styles.chip, active && { backgroundColor: activeColor }]}
            onPress={() => onSelect(opt.key)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: 4, maxHeight: 40,
  },
  rowContent: { alignItems: "center" },
  chip: {
    borderRadius: radius.full, paddingHorizontal: spacing.md, marginVertical: 4, marginRight: 4,
    alignItems: "center", justifyContent: "center", height: 30,
  },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: colors.bg, fontWeight: "700" },
});
