import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ImageBackground } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listManageableEvents, getPendingRegistrationCount, getPendingRegistrationCountsByEvent,
  EVENT_TYPE_LABEL, type EventRow, type EventStatus,
} from "../lib/api/events";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventsManage">;

const STATUS_LABEL: Record<EventStatus, string> = { draft: "Taslak", published: "Yayında", cancelled: "İptal" };
const STATUS_COLOR: Record<EventStatus, string> = { draft: colors.muted, published: colors.teal, cancelled: colors.coral };

export default function EventsManageScreen({ navigation }: Props) {
  useHomeButton(navigation);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingByEvent, setPendingByEvent] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [all, pending, byEvent] = await Promise.all([
        listManageableEvents(), getPendingRegistrationCount(), getPendingRegistrationCountsByEvent(),
      ]);
      setEvents(all);
      setPendingCount(pending);
      setPendingByEvent(byEvent);
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("EventForm", { eventId: undefined })}>
          <Text style={styles.addButtonText}>+ Etkinlik Oluştur</Text>
        </TouchableOpacity>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} bekleyen kayıt</Text>
          </View>
        )}
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz etkinlik oluşturulmadı.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          >
            <ImageBackground
              source={item.banner_url ? { uri: item.banner_url } : undefined}
              style={styles.rowBg}
              imageStyle={styles.rowBgImage}
            >
              {!item.banner_url && (
                <View style={styles.thumbPlaceholder}>
                  <Text style={{ fontSize: 40 }}>🏆</Text>
                </View>
              )}
              {!!pendingByEvent[item.id] && (
                <View style={styles.eventPendingBadge}>
                  <Text style={styles.eventPendingBadgeText}>{pendingByEvent[item.id]} bekleyen kayıt</Text>
                </View>
              )}
              <View style={styles.rowTextBlock}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowSub}>
                    {EVENT_TYPE_LABEL[item.type]} · {new Date(item.start_date).toLocaleDateString("tr-TR")}
                  </Text>
                  <Text style={[styles.badge, { color: STATUS_COLOR[item.status], borderColor: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md, gap: spacing.sm },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  pendingBadge: { backgroundColor: colors.coral, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  pendingBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  eventPendingBadge: {
    position: "absolute", top: spacing.sm, right: spacing.sm,
    backgroundColor: colors.coral, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 5,
  },
  eventPendingBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  rowBg: { width: "100%", height: 140, backgroundColor: colors.surface, justifyContent: "flex-end" },
  rowBgImage: { resizeMode: "cover" },
  thumbPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  // Koyu taban artık doğrudan yazı bloğunun kendi arka planı — fotoğrafın
  // büyük bir kısmını değil, sadece metnin olduğu alanı kaplıyor.
  rowTextBlock: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: "rgba(8,9,26,0.78)" },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  rowSub: { color: colors.ink, opacity: 0.85, fontSize: 12, marginTop: 2 },
  badge: {
    alignSelf: "flex-start", fontSize: 10, fontWeight: "700", marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, overflow: "hidden",
  },
  chevron: { color: colors.ink, fontSize: 24, fontWeight: "700" },
});
