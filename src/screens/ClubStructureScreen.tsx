import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ClubStructure">;

const ACCENTS = [colors.yellow, colors.teal, colors.coral];

const ITEMS: { icon: string; title: string; sub: string; screen: "GroupsList" | "BranchesList" | "VenuesList" }[] = [
  { icon: "🏷️", title: "Gruplar", sub: "Yaş grupları / takımlar", screen: "GroupsList" },
  { icon: "🏅", title: "Branşlar", sub: "Voleybol, basketbol vb.", screen: "BranchesList" },
  { icon: "🏟️", title: "Salonlar", sub: "Antrenman ve maç salonları", screen: "VenuesList" },
];

// Gruplar/Branşlar/Salonlar ekranları hem Kulüp Ayarları'nın kendi
// stack'inde hem de burada (HomeStack) kayıtlı — aynı bileşenler, iki
// yerden de açılabiliyor. Çapraz-sekme geçişi (getParent().navigate) YERİNE
// bilerek düz navigate kullanıyoruz: böylece geri tuşu Kulüp Yapısı'na
// döner ve alt menüde "Ana Menü" vurgulu kalır, "Kulüp Ayarları"na
// atlamaz.
export default function ClubStructureScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item, index) => {
        const accent = ACCENTS[index % ACCENTS.length];
        return (
          <TouchableOpacity
            key={item.screen}
            style={[styles.row, { borderColor: accent }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconBadge, { backgroundColor: `${accent}22` }]}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
  },
  iconBadge: { width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 22 },
  title: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.yellow, fontSize: 20, fontWeight: "700" },
});
