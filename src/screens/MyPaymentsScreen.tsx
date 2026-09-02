import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyAthletes } from "../lib/api/myAthletes";
import { listAthletePayments, isOverdue, type Payment } from "../lib/api/payments";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "MyPayments">;

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

export default function MyPaymentsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { settings } = useClubSettings();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya/bu ekrana her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          const athletes = await getMyAthletes();
          if (athletes.length === 0) {
            if (!cancelled) setError("Bağlı bir sporcu bulunamadı.");
            return;
          }
          if (!cancelled) setAthleteName(athletes[0].full_name);
          const data = await listAthletePayments(athletes[0].id);
          if (!cancelled) setPayments(data);
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Aidat bilgisi yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const upcoming = payments
    .filter((p) => p.status !== "paid")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const history = payments
    .filter((p) => p.status === "paid")
    .sort((a, b) => b.due_date.localeCompare(a.due_date));

  const renderPayment = (item: Payment) => {
    const overdue = isOverdue(item, settings.payment_overdue_grace_days);
    const statusLabel = item.status === "paid" ? "Ödendi" : overdue ? "Gecikmiş" : "Bekliyor";
    const statusColor = item.status === "paid" ? colors.teal : overdue ? colors.coral : colors.muted;
    const unpaid = item.status !== "paid";
    const content = (
      <>
        <View>
          <Text style={styles.rowAmount}>{item.amount.toLocaleString("tr-TR")} ₺</Text>
          <Text style={styles.rowSub}>{PERIOD_LABEL[item.period]} · Vade: {item.due_date}</Text>
        </View>
        <Text style={[styles.statusBadge, { color: statusColor }]}>{statusLabel}</Text>
      </>
    );
    if (!unpaid) {
      return <View key={item.id} style={styles.row}>{content}</View>;
    }
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.row}
        onPress={() =>
          navigation.navigate("MakePayment", {
            paymentId: item.id,
            amount: item.amount,
            dueDate: item.due_date,
            athleteName: athleteName ?? "Sporcu",
          })
        }
      >
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!!athleteName && <Text style={styles.subtitle}>{athleteName}</Text>}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(item) => item.key}
        renderItem={() => (
          <View>
            <Text style={styles.sectionLabel}>Yaklaşan Ödemeler</Text>
            {!loading && upcoming.length === 0 && <Text style={styles.empty}>Yaklaşan ödeme yok.</Text>}
            {upcoming.map(renderPayment)}

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Geçmiş Ödemeler</Text>
            {!loading && history.length === 0 && <Text style={styles.empty}>Henüz ödenmiş aidat yok.</Text>}
            {history.map(renderPayment)}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />

      <Text style={styles.note}>Ödemek için yaklaşan bir aidata dokun.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm },
  error: { color: colors.coral, marginTop: spacing.md },
  empty: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowAmount: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusBadge: { fontWeight: "700", fontSize: 13 },
  note: { color: colors.muted, fontSize: 11, textAlign: "center", marginTop: spacing.md },
});
