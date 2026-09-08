import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ImageBackground } from "react-native";
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
            <ImageBackground
              source={item.banner_url ? { uri: item.banner_url } : undefined}
              style={styles.cardBg}
              imageStyle={styles.cardBgImage}
            >
              {!item.banner_url && (
                <View style={styles.cardImagePlaceholder}>
                  <Text style={{ fontSize: 48 }}>🏆</Text>
                </View>
              )}
              {/* Fotoğraf her renkte olabileceği için hafif genel bir
                  karartma + yazı bloğunun altında daha koyu bir taban —
                  metin her koşulda okunaklı kalsın diye. */}
              <View style={styles.cardScrim} pointerEvents="none" />

              <View style={styles.cardTopRow}>
                <Text style={styles.typeBadge}>{EVENT_TYPE_LABEL[item.type]}</Text>
              </View>

              <View style={styles.cardTextBlock}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {new Date(item.start_date).toLocaleDateString("tr-TR")}
                  {item.location ? ` · ${item.location}` : ""}
                </Text>
                <Text style={styles.cardPrice}>
                  {item.fee_try > 0 ? `${item.fee_try.toLocaleString("tr-TR")} ₺` : "Ücretsiz"}
                </Text>
              </View>
            </ImageBackground>
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
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  cardBg: { width: "100%", height: 220, backgroundColor: colors.surface, justifyContent: "space-between" },
  cardBgImage: { resizeMode: "cover" },
  cardImagePlaceholder: {
    ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface,
  },
  // Fotoğraf her parlaklıkta olabileceği için alt kısımda sabit koyu bir
  // "başlık şeridi" — metin bloğu her zaman bunun üzerinde, kontrast garanti.
  cardScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", backgroundColor: "rgba(8,9,26,0.78)" },
  cardTopRow: { flexDirection: "row", padding: spacing.sm },
  typeBadge: {
    backgroundColor: "rgba(16,18,42,0.8)", borderRadius: radius.full, overflow: "hidden",
    paddingHorizontal: spacing.sm, paddingVertical: 3, color: colors.ink, fontSize: 11, fontWeight: "700",
  },
  cardTextBlock: { padding: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  cardMeta: { color: colors.ink, opacity: 0.85, fontSize: 12, marginTop: 4 },
  cardPrice: { color: colors.yellow, fontSize: 16, fontWeight: "800", marginTop: spacing.xs },
});
