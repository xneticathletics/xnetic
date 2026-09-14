import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { PERFORMANCE_CATEGORIES } from "../lib/performanceTests";
import { useHomeButton } from "../hooks/useHomeButton";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import AthletePickerModal from "../components/AthletePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleticPerformance">;

export default function AthleticPerformanceScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { isLocked: isBranchCoordinator } = useBranchSelect();
  // Test/Test Grubu ekleme: admin, branş koordinatörü, süper admin —
  // sıradan antrenör sadece var olan testleri kullanıp ölçüm girebilir.
  const canManage = role === "club_admin" || role === "super_admin" || (role === "coach" && isBranchCoordinator);
  // Süper admin hiçbir kulübün sporcusuna/test grubuna bağlı değil —
  // "Ölçümler" (sporcu seçip ölçüm girme) ve "Test Grubu Ekle" (kulübe özel
  // sporcu grubu) onun için anlamsız. Sadece platform genelinde görünen
  // yeni bir test TANIMI eklemesi ("Test Ekle") mantıklı, o da tam satır.
  const isSuperAdmin = role === "super_admin";
  const [athletePickerVisible, setAthletePickerVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {!isSuperAdmin && (
        <TouchableOpacity style={styles.measurementsButton} onPress={() => setAthletePickerVisible(true)}>
          <Text style={styles.measurementsButtonText}>📊 Ölçümler</Text>
        </TouchableOpacity>
      )}

      {canManage && (
        isSuperAdmin ? (
          <TouchableOpacity style={styles.fullActionBox} onPress={() => navigation.navigate("PerformanceTestForm")}>
            <Text style={styles.actionBoxText}>+ Test Ekle</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate("PerformanceTestForm")}>
              <Text style={styles.actionBoxText}>+ Test Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate("TestGroupsList")}>
              <Text style={styles.actionBoxText}>+ Test Grubu Ekle</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      <Text style={styles.subtitle}>Bir kategori seç, testi seç, sporcunun ölçümünü kaydet.</Text>

      <View style={styles.grid}>
        {PERFORMANCE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tile, { borderColor: cat.color }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("PerformanceCategory", { category: cat.key })}
          >
            <View style={[styles.decorCircle, { backgroundColor: cat.soft }]} />
            <View style={styles.tileContent}>
              <Text style={styles.tileIcon}>{cat.icon}</Text>
              <Text style={styles.tileLabel}>{cat.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <AthletePickerModal
        visible={athletePickerVisible}
        selectedId={null}
        onSelect={(athlete) => {
          setAthletePickerVisible(false);
          navigation.navigate("AthletePerformanceView", { athleteId: athlete.id, athleteName: athlete.full_name });
        }}
        onClose={() => setAthletePickerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  measurementsButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14,
    alignItems: "center", marginBottom: spacing.md,
  },
  measurementsButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actionBox: {
    flex: 1, backgroundColor: colors.yellow, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center",
  },
  fullActionBox: {
    backgroundColor: colors.yellow, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginBottom: spacing.md,
  },
  actionBoxText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    width: "31%", aspectRatio: 1, backgroundColor: colors.surface, borderWidth: 2,
    borderRadius: radius.md, overflow: "hidden",
  },
  decorCircle: {
    position: "absolute", top: -16, right: -16, width: 56, height: 56, borderRadius: 28,
  },
  tileContent: {
    flex: 1, width: "100%", alignItems: "center", justifyContent: "center", padding: 6,
  },
  tileIcon: { fontSize: 24, marginBottom: 2, textAlign: "center" },
  tileLabel: { color: colors.ink, fontSize: 11, fontWeight: "800", textAlign: "center" },
});
