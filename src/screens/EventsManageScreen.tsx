import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listManageableEvents, getPendingRegistrationCount, EVENT_TYPE_LABEL, type EventRow, type EventStatus } from "../lib/api/events";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventsManage">;

const STATUS_LABEL: Record<EventStatus, string> = { draft: "Taslak", published: "Yayında", cancelled: "İptal" };
const STATUS_COLOR: Record<EventStatus, string> = { draft: colors.muted, published: colors.teal, cancelled: colors.coral };

export default function EventsManageScreen({ navigation }: Props) {
  useHomeButton(navigation);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [all, pending] = await Promise.all([listManageableEvents(), getPendingRegistrationCount()]);
      setEvents(all);
      setPendingCount(pending);
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
            {item.banner_url ? (
              <Image source={{ uri: item.banner_url }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 28 }}>🏆</Text>
              </View>
            )}
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
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  thumbPlaceholder: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: {
    alignSelf: "flex-start", fontSize: 10, fontWeight: "700", marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, overflow: "hidden",
  },
  chevron: { color: colors.muted, fontSize: 20, fontWeight: "700" },
});
