import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getPerformanceCategory } from "../lib/performanceTests";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "PerformanceCategory">;

export default function PerformanceCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const meta = getPerformanceCategory(category);

  useEffect(() => {
    if (meta) navigation.setOptions({ title: meta.label });
  }, [meta, navigation]);

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Kategori bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.heroCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
        <Text style={styles.heroIcon}>{meta.icon}</Text>
        <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.heroSubtitle}>Kolaydan zora sıralı — bir test seç</Text>
      </View>

      <FlatList
        data={meta.tests}
        keyExtractor={(t) => t.key}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("PerformanceTestDetail", { testKey: item.key })}
          >
            <View style={[styles.rowIndex, { backgroundColor: meta.soft }]}>
              <Text style={[styles.rowIndexText, { color: meta.color }]}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              {!!item.equipment && <Text style={styles.rowEquipment}>🔧 {item.equipment}</Text>}
            </View>
            <Text style={[styles.rowUnit, { color: meta.color }]}>{item.unit}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  error: { color: colors.coral, marginTop: spacing.xl, textAlign: "center" },
  heroCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg },
  heroIcon: { fontSize: 40, marginBottom: spacing.xs },
  heroTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  heroSubtitle: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: "center" },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowIndex: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  rowIndexText: { fontSize: 12, fontWeight: "800" },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowEquipment: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rowUnit: { fontSize: 12, fontWeight: "700" },
});
