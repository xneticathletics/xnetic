import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getEvent, listEventRegistrations, updateRegistrationStatus,
  REGISTRATION_STATUS_LABEL, type EventRegistrationRow, type EventRegistrationStatus,
} from "../lib/api/events";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventRegistrations">;

const STATUS_COLOR: Record<EventRegistrationStatus, string> = {
  pending: colors.yellow, approved: colors.teal, rejected: colors.coral, cancelled: colors.muted,
};
const PAYMENT_LABEL: Record<string, string> = { havale: "Havale/EFT", elden: "Elden" };

export default function EventRegistrationsScreen({ route }: Props) {
  const { eventId } = route.params;
  const [eventTitle, setEventTitle] = useState("");
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [event, regs] = await Promise.all([getEvent(eventId), listEventRegistrations(eventId)]);
      setEventTitle(event.title);
      setRegistrations(regs);
    } catch (e: any) {
      setError(e.message ?? "Kayıtlar yüklenemedi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePress = (reg: EventRegistrationRow) => {
    if (reg.status !== "pending") {
      if (reg.receipt_url) {
        Alert.alert(reg.athletes?.full_name ?? "Kayıt", undefined, [
          { text: "Kapat", style: "cancel" },
          { text: "Dekontu Görüntüle", onPress: () => Linking.openURL(reg.receipt_url!) },
        ]);
      }
      return;
    }

    const actions: { key: "approved" | "rejected"; label: string }[] = [
      { key: "approved", label: "Onayla" },
      { key: "rejected", label: "Reddet" },
    ];

    Alert.alert(
      reg.athletes?.full_name ?? "Kayıt",
      `${reg.amount_due.toLocaleString("tr-TR")} ₺${reg.payment_method ? ` · ${PAYMENT_LABEL[reg.payment_method] ?? reg.payment_method}` : ""}`,
      [
        { text: "Vazgeç", style: "cancel" },
        ...(reg.receipt_url ? [{ text: "Dekontu Görüntüle", onPress: () => Linking.openURL(reg.receipt_url!) }] : []),
        ...actions.map((a) => ({
          text: a.label,
          style: a.key === "rejected" ? ("destructive" as const) : undefined,
          onPress: async () => {
            try {
              await updateRegistrationStatus(reg.id, a.key, eventTitle);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Güncellenemedi", [{ text: "Tamam" }]);
            }
          },
        })),
      ]
    );
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
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz kayıt yok.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.athletes?.full_name ?? "Sporcu"}</Text>
              {!!item.athletes?.parent_phone && <Text style={styles.rowSub}>{item.athletes.parent_phone}</Text>}
              {item.payment_method && <Text style={styles.rowSub}>{PAYMENT_LABEL[item.payment_method] ?? item.payment_method}</Text>}
              {!!item.note && <Text style={styles.rowNote}>{item.note}</Text>}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowAmount}>{item.amount_due > 0 ? `${item.amount_due.toLocaleString("tr-TR")} ₺` : "Ücretsiz"}</Text>
              <Text style={[styles.badge, { color: STATUS_COLOR[item.status], borderColor: STATUS_COLOR[item.status] }]}>
                {REGISTRATION_STATUS_LABEL[item.status]}
              </Text>
            </View>
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
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowNote: { color: colors.muted, fontSize: 11, marginTop: 2, fontStyle: "italic" },
  rowAmount: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  badge: { fontSize: 10, fontWeight: "700", marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, overflow: "hidden" },
});
