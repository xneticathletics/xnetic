import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyAthletes, type MyAthlete } from "../lib/api/myAthletes";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteTrackingList">;

export default function AthleteTrackingListScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const [athletes, setAthletes] = useState<MyAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getMyAthletes()
        .then((data) => { if (!cancelled) setAthletes(data); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Takip etmek istediğin sporcuyu seç.</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}

      <FlatList
        data={athletes}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bağlı bir sporcu bulunamadı.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("AthleteTrackingHub", { athleteId: item.id, athleteName: item.full_name })}
          >
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.full_name}</Text>
              {!!item.groups?.name && <Text style={styles.cardSub}>{item.groups.name}</Text>}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 18 },
});
