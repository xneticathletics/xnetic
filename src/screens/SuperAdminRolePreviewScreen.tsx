import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing, accentRotation, accentSoftRotation } from "../theme/tokens";
import { TILES_BY_ROLE, COORDINATOR_TILES } from "./HomeScreen";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminRolePreview">;

export default function SuperAdminRolePreviewScreen({ route, navigation }: Props) {
  useHomeButton(navigation);
  const { role, label, coordinator } = route.params;
  const tiles = coordinator ? COORDINATOR_TILES : TILES_BY_ROLE[role] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>{label} — Ana Sayfa Önizlemesi</Text>
      <Text style={styles.banner}>
        🔍 Bu bir önizleme. Kutucuklar gerçek veriyle çalışmaz — sadece bu rolün Ana Sayfa'da
        neler göreceğini gösterir.
      </Text>

      <View style={styles.grid}>
        {tiles.length === 0 && <Text style={styles.empty}>Bu rol için tanımlı kutucuk yok.</Text>}
        {tiles.map((tile, index) => (
          <View
            key={tile.key}
            style={[
              styles.tile,
              {
                borderColor: accentRotation[index % accentRotation.length],
                backgroundColor: accentSoftRotation[index % accentSoftRotation.length],
              },
            ]}
          >
            <Text style={styles.tileIcon}>{tile.icon}</Text>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            {!!tile.sub && <Text style={styles.tileSub}>{tile.sub}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
  banner: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, width: "100%" },
  tile: {
    width: "47%", aspectRatio: 1, borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.md, justifyContent: "center", alignItems: "center", opacity: 0.85,
  },
  tileIcon: { fontSize: 30, marginBottom: spacing.xs },
  tileLabel: { color: colors.ink, fontSize: 13, fontWeight: "700", textAlign: "center" },
  tileSub: { color: colors.muted, fontSize: 10, marginTop: 4, textAlign: "center" },
});
