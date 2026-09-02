import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "Fitness">;

const ACCENTS = [colors.teal, colors.coral, colors.yellow];

const TILES: { key: "CoachWellness" | "FitnessTraining" | "FitnessProgram"; icon: string; title: string; sub: string }[] = [
  { key: "CoachWellness", icon: "🌡️", title: "Wellness Check-in", sub: "Uyku, enerji ve ruh hâli takibi" },
  { key: "FitnessTraining", icon: "🏋️", title: "Çalışma", sub: "Göğüs, sırt, bacak, kol, omuz" },
  { key: "FitnessProgram", icon: "📋", title: "Program", sub: "Örnek Programlar" },
];

export default function FitnessScreen({ navigation }: Props) {
  useHomeButton(navigation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.grid}>
        {TILES.map((t, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tile, { borderColor: accent }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(t.key)}
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
