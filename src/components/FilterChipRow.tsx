import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
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
  // Çipler taşıp kaydırma gerektiğinde sağ kenarda küçük bir ok/gölge
  // göstererek "daha var, kaydır" ipucu verir — çok sayıda seçeneği olan
  // filtrelerde (ör. Takvim'deki grup listesi) kullanıcı bunu fark
  // etmeyip son çipleri hiç görmeyebiliyordu.
  showScrollHint?: boolean;
};

// Takvim ekranındaki branş/grup filtreleriyle aynı "track" görünümü —
// her çipin kendi çerçevesi yerine, ortak bir zemin (colors.surface)
// üzerinde duran haplar. Sporcular/Antrenörler/Finans gibi liste filtreli
// TÜM ekranlarda aynı görsel dilin kullanılması için paylaşılan bileşen —
// tek yerden değiştirilince hepsi birden güncellenir.
export default function FilterChipRow({ options, activeKey, onSelect, activeColor = colors.yellow, style, showScrollHint = false }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const EPSILON = 4;
  const canScrollMore = showScrollHint && contentWidth > containerWidth + EPSILON && scrollX < contentWidth - containerWidth - EPSILON;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollX(e.nativeEvent.contentOffset.x);

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={showScrollHint ? handleScroll : undefined}
        scrollEventThrottle={32}
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
      {canScrollMore && (
        <View style={styles.scrollHint} pointerEvents="none">
          <Text style={styles.scrollHintIcon}>›</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
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
  scrollHint: {
    position: "absolute", right: 2, top: 2, bottom: 2, width: 22,
    alignItems: "center", justifyContent: "center",
    backgroundColor: `${colors.surface}E6`, borderTopRightRadius: radius.full, borderBottomRightRadius: radius.full,
  },
  scrollHintIcon: { color: colors.yellow, fontSize: 15, fontWeight: "800" },
});
