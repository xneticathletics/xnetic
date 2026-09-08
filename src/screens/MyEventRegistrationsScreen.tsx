import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listMyRegistrations, cancelMyRegistration, REGISTRATION_STATUS_LABEL,
  type EventRegistrationRow, type EventRegistrationStatus,
} from "../lib/api/events";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "MyEventRegistrations">;

const STATUS_COLOR: Record<EventRegistrationStatus, string> = {
  pending: colors.yellow, approved: colors.teal, rejected: colors.coral, cancelled: colors.muted,
};

export default function MyEventRegistrationsScreen({ navigation }: Props) {
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRegistrations(await listMyRegistrations());
    } catch (e: any) {
      setError(e.message ?? "Kayıtlar yüklenemedi");
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

  const handleCancel = (reg: EventRegistrationRow) => {
    Alert.alert("Kaydı iptal et", "Bu etkinlik kaydını iptal etmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "İptal Et", style: "destructive",
        onPress: async () => {
          try {
            await cancelMyRegistration(reg.id);
            load();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "İptal edilemedi", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={registrations}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz bir etkinliğe kaydolmadın.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.event_id })}
          >
            {item.events?.banner_url ? (
              <Image source={{ uri: item.events.banner_url }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.events?.title ?? "Etkinlik"}</Text>
              {!!item.events?.start_date && (
                <Text style={styles.rowSub}>{new Date(item.events.start_date).toLocaleDateString("tr-TR")}</Text>
              )}
              <Text style={[styles.badge, { color: STATUS_COLOR[item.status], borderColor: STATUS_COLOR[item.status] }]}>
                {REGISTRATION_STATUS_LABEL[item.status]}
              </Text>
            </View>
            {item.status === "pending" && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item)}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginTop: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: {
    alignSelf: "flex-start", fontSize: 10, fontWeight: "700", marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, overflow: "hidden",
  },
  cancelButton: { borderWidth: 1, borderColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  cancelButtonText: { color: colors.coral, fontWeight: "700", fontSize: 11 },
});
