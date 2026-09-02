import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAthletePayments, markPaymentPaid, isOverdue, type Payment } from "../lib/api/payments";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "AthletePayments">;

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

export default function AthletePaymentsScreen({ route, navigation }: Props) {
  const { athleteId, athleteName } = route.params;
  const { settings } = useClubSettings();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPayments(await listAthletePayments(athleteId));
    } catch (e: any) {
      setError(e.message ?? "Aidat bilgisi yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [athleteId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleMarkPaid = async (id: string, amount: number) => {
    Alert.alert(
      "Ödendi olarak işaretle",
      `${amount.toLocaleString("tr-TR")} ₺ tutarındaki aidatı ödendi olarak işaretlemek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, İşaretle",
          onPress: async () => {
            try {
              await markPaymentPaid(id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "İşaretlenemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  const upcoming = payments.filter((p) => p.status !== "paid").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const history = payments.filter((p) => p.status === "paid").sort((a, b) => b.due_date.localeCompare(a.due_date));

  const renderRow = (item: Payment) => {
    const overdue = isOverdue(item, settings.payment_overdue_grace_days);
    const statusLabel = item.status === "paid" ? "Ödendi" : overdue ? "Gecikmiş" : "Bekliyor";
    const statusColor = item.status === "paid" ? colors.teal : overdue ? colors.coral : colors.muted;
    return (
      <View key={item.id} style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowAmount}>{item.amount.toLocaleString("tr-TR")} ₺</Text>
          <Text style={styles.rowSub}>{PERIOD_LABEL[item.period]} · Vade: {item.due_date}</Text>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {item.status !== "paid" && (
          <TouchableOpacity style={styles.payButton} onPress={() => handleMarkPaid(item.id, item.amount)}>
            <Text style={styles.payButtonText}>Ödendi İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{athleteName}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("PaymentForm", { athleteId, athleteName })}
        >
          <Text style={styles.addButtonText}>+ Plan</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(item) => item.key}
        renderItem={() => (
          <View>
            <Text style={styles.sectionLabel}>Yaklaşan Ödemeler</Text>
            {!loading && upcoming.length === 0 && <Text style={styles.empty}>Yaklaşan ödeme yok.</Text>}
            {upcoming.map(renderRow)}

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Geçmiş Ödemeler</Text>
            {!loading && history.length === 0 && <Text style={styles.empty}>Henüz ödenmiş aidat yok.</Text>}
            {history.map(renderRow)}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowAmount: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  payButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  payButtonText: { color: colors.teal, fontWeight: "700", fontSize: 11 },
});
