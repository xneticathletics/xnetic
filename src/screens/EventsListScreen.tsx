import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listPublishedEvents, EVENT_TYPE_LABEL, type EventRow } from "../lib/api/events";
import { useAuth } from "../context/AuthContext";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventsList">;

export default function EventsListScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEvents(await listPublishedEvents());
    } catch (e: any) {
      setError(e.message ?? "Etkinlikler yüklenemedi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      {(role === "parent" || role === "athlete") && (
        <TouchableOpacity style={styles.myRegistrationsButton} onPress={() => navigation.navigate("MyEventRegistrations")}>
          <Text style={styles.myRegistrationsButtonText}>📋 Kayıtlarım</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz yayınlanmış bir etkinlik yok.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          >
            {item.banner_url ? (
              <Image source={{ uri: item.banner_url }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Text style={{ fontSize: 40 }}>🏆</Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{EVENT_TYPE_LABEL[item.type]}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {new Date(item.start_date).toLocaleDateString("tr-TR")}
                {item.location ? ` · ${item.location}` : ""}
              </Text>
              <Text style={styles.cardPrice}>
                {item.fee_try > 0 ? `${item.fee_try.toLocaleString("tr-TR")} ₺` : "Ücretsiz"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  myRegistrationsButton: {
    alignSelf: "flex-end", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.md,
  },
  myRegistrationsButtonText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: "100%", height: 150, backgroundColor: colors.bg },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  typeBadge: {
    position: "absolute", top: spacing.sm, left: spacing.sm,
    backgroundColor: "rgba(16,18,42,0.75)", borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  typeBadgeText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  cardBody: { padding: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cardPrice: { color: colors.yellow, fontSize: 15, fontWeight: "800", marginTop: spacing.xs },
});
