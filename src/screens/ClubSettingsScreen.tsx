import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { ClubSettingsStackParamList } from "../navigation/ClubSettingsStack";

type Props = NativeStackScreenProps<ClubSettingsStackParamList, "ClubSettingsHome">;

const ACCENTS = [colors.yellow, colors.teal, colors.coral, colors.violet];

const TILES: { key: keyof ClubSettingsStackParamList; icon: string; title: string; sub: string }[] = [
  { key: "HomeFeatures", icon: "🧩", title: "Ana Sayfa Özellikleri", sub: "Kullanılacak ana başlıkları seç" },
  { key: "ClubLogo", icon: "🖼️", title: "Kulüp Adı ve Logosu", sub: "Giriş ve Ana Sayfa'da görünür" },
  { key: "ClubBankInfo", icon: "🏦", title: "Banka Bilgileri", sub: "Havale/EFT için IBAN" },
  { key: "UsersList", icon: "👥", title: "Kullanıcılar", sub: "Hesapları yönet, şifre sıfırla" },
  { key: "ClubExport", icon: "📤", title: "Kulüp Bilgilerini Dışa Aktar", sub: "Sporcu, antrenör, grup verilerini Excel'e al" },
  { key: "AdvancedSettings", icon: "⚙️", title: "Gelişmiş Ayarlar", sub: "Zaman pencereleri, limitler vb." },
];

export default function ClubSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Kulüp Ayarları</Text>
      <View style={styles.grid}>
        {TILES.map((t, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tile, { borderColor: accent }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(t.key as any)}
            >
              <View style={[styles.iconBadge, { backgroundColor: `${accent}22` }]}>
                <Text style={styles.iconText}>{t.icon}</Text>
              </View>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={styles.tileSub}>{t.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  title: { color: colors.ink, fontSize: 22, fontWeight: "700", marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%", minHeight: 110, backgroundColor: colors.surface, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md, justifyContent: "flex-start",
  },
  iconBadge: {
    width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconText: { fontSize: 20 },
  tileTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: 4 },
  tileSub: { color: colors.muted, fontSize: 11, lineHeight: 15 },
});
