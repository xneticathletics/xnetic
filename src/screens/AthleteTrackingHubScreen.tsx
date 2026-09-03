import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteTrackingHub">;

const ACCENTS = [colors.teal, colors.coral, colors.violet];

const TILES: { key: "AthletePerformanceView" | "AthleteFitnessView" | "AthleteWellnessDetail" | "AthleteFitnessProgram"; icon: string; title: string; sub: string }[] = [
  { key: "AthletePerformanceView", icon: "⏱️", title: "Ölçümler", sub: "Hız, sıçrama, kuvvet ve dayanıklılık testleri" },
  { key: "AthleteFitnessView", icon: "🏋️", title: "Çalışma", sub: "Fitness/kuvvet antrenmanı geçmişi" },
  { key: "AthleteWellnessDetail", icon: "🌡️", title: "Günlük Durum", sub: "Uyku, enerji, yorgunluk check-in geçmişi" },
  { key: "AthleteFitnessProgram", icon: "📋", title: "Program", sub: "Antrenörün yayınladığı çalışma programı" },
];

export default function AthleteTrackingHubScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;

  useEffect(() => {
    navigation.setOptions({ title: athleteName });
  }, [athleteName, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Gelişimini takip et — sadece görüntüleme.</Text>

      <View style={styles.grid}>
        {TILES.map((t, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tile, { borderColor: accent }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(t.key, { athleteId, athleteName })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%", aspectRatio: 1, backgroundColor: colors.surface, borderWidth: 1,
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
