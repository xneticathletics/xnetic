import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useBranchSelect } from "../context/BranchSelectContext";
import { getMyAthletes } from "../lib/api/myAthletes";

type Props = {
  role: UserRole;
  navigation: NativeStackNavigationProp<HomeStackParamList, "PerformanceHub">;
};

const ACCENTS = [colors.yellow, colors.teal, colors.coral, colors.violet];

type HubItem = { key: string; icon: string; title: string; sub: string; onPress: () => void };

// Ana Sayfa'da ayrı ayrı duran Fitness/Performans Ölçümleri/Beslenme
// kutucuklarının birleştiği tek giriş noktası. Hangi alt öğelerin
// görüneceği role göre değişir: Kulüp Admini/Branş Koordinatörü üçünü de,
// Antrenör sadece Fitness+Beslenme'yi, Sporcu Performansım+Beslenme'yi,
// Veli sadece Beslenme'yi görür (o roller zaten diğer öğelere hiç sahip
// değildi — bkz. HomeScreen.tsx eski TILES_BY_ROLE).
export default function PerformanceHubScreen({ role, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isLocked } = useBranchSelect();
  const isBranchCoordinator = role === "coach" && isLocked;

  const items: HubItem[] = [];

  if (role === "club_admin" || isBranchCoordinator) {
    items.push({
      key: "fitness", icon: "💪", title: "Fitness", sub: "Check-in ve çalışma takibi",
      onPress: () => navigation.navigate("Fitness"),
    });
    items.push({
      key: "performans", icon: "⏱️", title: "Performans Ölçümleri",
      sub: "Hız, sıçrama, kuvvet ve dayanıklılık testleri",
      onPress: () => navigation.navigate("AthleticPerformance"),
    });
  } else if (role === "coach") {
    items.push({
      key: "fitness", icon: "💪", title: "Fitness", sub: "Check-in ve çalışma takibi",
      onPress: () => navigation.navigate("Fitness"),
    });
  } else if (role === "athlete") {
    items.push({
      key: "performansim", icon: "📊", title: "Performansım", sub: "Ölçümlerini ve gelişimini gör",
      onPress: async () => {
        const athletes = await getMyAthletes();
        const me = athletes[0];
        if (me) navigation.navigate("AthleteTrackingHub", { athleteId: me.id, athleteName: me.full_name });
      },
    });
  }

  items.push({
    key: "beslenme", icon: "🥗", title: "Beslenme", sub: "Besinler ve tarifler",
    onPress: () => navigation.navigate("Nutrition"),
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Performans</Text>
      <View style={styles.grid}>
        {items.map((item, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tile, { borderColor: accent }]}
              activeOpacity={0.8}
              onPress={item.onPress}
            >
              <View style={[styles.iconBadge, { backgroundColor: `${accent}22` }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <Text style={styles.tileTitle}>{item.title}</Text>
              <Text style={styles.tileSub}>{item.sub}</Text>
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
