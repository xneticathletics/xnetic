import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";
import type { UserRole } from "../context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminScreens">;

const ROLES: { role: UserRole; label: string; icon: string; coordinator?: boolean; accent: string }[] = [
  { role: "club_admin", label: "Kulüp Admini", icon: "🏢", accent: colors.yellow },
  { role: "coach", label: "Branş Koordinatörü", icon: "🏷️", coordinator: true, accent: colors.violet },
  { role: "coach", label: "Antrenör", icon: "🧑‍🏫", accent: colors.teal },
  { role: "parent", label: "Veli", icon: "👪", accent: colors.coral },
  { role: "athlete", label: "Sporcu", icon: "🏃", accent: colors.yellow },
];

export default function SuperAdminScreensScreen({ navigation }: Props) {
  useHomeButton(navigation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.subtitle}>
        Bir rol seç, o rolün Ana Sayfa'sını önizle. Bu bir önizleme — gerçek sporcu/veli/kulüp
        verisi göstermez, sadece o rolün kutucuk düzenini gösterir.
      </Text>

      <View style={styles.grid}>
        {ROLES.map((r, index) => (
          <TouchableOpacity
            key={r.label}
            style={[styles.tile, { borderColor: r.accent }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("SuperAdminRolePreview", { role: r.role, label: r.label, coordinator: !!r.coordinator })}
          >
            <View style={[styles.iconBadge, { backgroundColor: `${r.accent}22` }]}>
              <Text style={styles.iconText}>{r.icon}</Text>
            </View>
            <Text style={styles.tileTitle}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.xs },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%", aspectRatio: 1.1, backgroundColor: colors.surface, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md, justifyContent: "center", alignItems: "center",
  },
  iconBadge: {
    width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconText: { fontSize: 22 },
  tileTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", textAlign: "center" },
});
