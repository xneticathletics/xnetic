import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { ClubSettingsStackParamList } from "../navigation/ClubSettingsStack";

type Props = NativeStackScreenProps<ClubSettingsStackParamList, "AdvancedSettings">;

const CATEGORIES: {
  key: keyof ClubSettingsStackParamList;
  icon: string;
  title: string;
  sub: string;
  accent: string;
}[] = [
  {
    key: "AttendanceSettings",
    icon: "📋",
    title: "Yoklama & Antrenman",
    sub: "Yoklama pencereleri, otomatik tamamlama",
    accent: colors.yellow,
  },
  {
    key: "CoachSettings",
    icon: "🧑‍🏫",
    title: "Antrenör Yönetimi",
    sub: "Yardımcı antrenör limiti",
    accent: colors.teal,
  },
  {
    key: "FinanceSettings",
    icon: "💰",
    title: "Aidat & Finans",
    sub: "Aidat planı, gecikme, finansal dönem",
    accent: colors.coral,
  },
  {
    key: "AnnouncementSettings",
    icon: "📣",
    title: "Duyurular",
    sub: "Görünürlük süreleri",
    accent: colors.violet,
  },
];

export default function AdvancedSettingsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.infoBox}>
        Bu sayılar daha önce kodun içine gömülüydü, her değişiklik için bize gelmen gerekiyordu. Bir konu seç,
        istediğin değerleri doğrudan buradan değiştir.
      </Text>

      <View style={styles.grid}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.tile, { borderColor: c.accent }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(c.key as any)}
          >
            <View style={[styles.iconBadge, { backgroundColor: `${c.accent}22` }]}>
              <Text style={styles.iconText}>{c.icon}</Text>
            </View>
            <Text style={styles.tileTitle}>{c.title}</Text>
            <Text style={styles.tileSub}>{c.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%", minHeight: 130, backgroundColor: colors.surface, borderWidth: 1,
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
