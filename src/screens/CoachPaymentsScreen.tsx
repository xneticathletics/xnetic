import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listCoachPayments, markCoachPaymentPaid, markCoachPaymentPending, deleteCoachPayment, type CoachPayment,
} from "../lib/api/coachPayments";
import { topUpAllActiveCoachPlans } from "../lib/api/coachPaymentPlans";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachPayments">;

type StatusFilter = "all" | "pending" | "paid";

function formatTL(n: number) {
  return `${Number(n).toLocaleString("tr-TR")} ₺`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function CoachPaymentsScreen({ navigation }: Props) {
  const [payments, setPayments] = useState<CoachPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Ekran her açıldığında aktif planların önümüzdeki 3 aylık ufkunu
      // tazeler — zaman ne kadar geçmiş olursa olsun otomatik tamamlanır.
      await topUpAllActiveCoachPlans();
      setPayments(await listCoachPayments());
    } catch (e: any) {
      setError(e.message ?? "Ödemeler yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const totals = useMemo(() => {
    let pending = 0;
    let paid = 0;
    payments.forEach((p) => {
      if (p.status === "paid") paid += Number(p.amount);
      else pending += Number(p.amount);
    });
    return { pending, paid };
  }, [payments]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? payments : payments.filter((p) => p.status === statusFilter)),
    [payments, statusFilter]
  );

  const handleTogglePaid = (item: CoachPayment) => {
    if (item.status === "pending") {
      Alert.alert(
        "Ödendi olarak işaretle",
        `${item.users?.name ?? "Antrenör"} için ${formatTL(item.amount)} tutarındaki ödemeyi ödendi olarak işaretlemek istiyor musun?`,
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Ödendi İşaretle",
            onPress: async () => {
              try {
                await markCoachPaymentPaid(item.id);
                load();
              } catch (e: any) {
                Alert.alert("Hata", e.message ?? "İşlem başarısız", [{ text: "Tamam" }]);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Bekliyor olarak işaretle",
        "Bu ödemeyi tekrar bekliyor durumuna almak istiyor musun?",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Geri Al",
            onPress: async () => {
              try {
                await markCoachPaymentPending(item.id);
                load();
              } catch (e: any) {
                Alert.alert("Hata", e.message ?? "İşlem başarısız", [{ text: "Tamam" }]);
              }
            },
          },
        ]
      );
    }
  };

  const handleDelete = (item: CoachPayment) => {
    Alert.alert(
      "Ödeme kaydını sil",
      `${item.users?.name ?? "Antrenör"} için ${formatTL(item.amount)} tutarındaki kaydı silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCoachPayment(item.id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.advanceButton} onPress={() => navigation.navigate("CoachAdvanceForm")}>
          <Text style={styles.advanceButtonText}>+ Avans Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("CoachPaymentForm")}>
          <Text style={styles.addButtonText}>+ Ödeme Planı</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summarySubLabel}>Bekleyen</Text>
          <Text style={[styles.summaryValue, { color: colors.yellow }]}>{formatTL(totals.pending)}</Text>
        </View>
        <View>
          <Text style={styles.summarySubLabel}>Ödenen</Text>
          <Text style={[styles.summaryValue, { color: colors.teal }]}>{formatTL(totals.paid)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {([
          { key: "all", label: "Tümü" },
          { key: "pending", label: "Bekleyen" },
          { key: "paid", label: "Ödendi" },
        ] as { key: StatusFilter; label: string }[]).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, statusFilter === f.key && styles.chipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Kayıt bulunamadı.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, item.status === "paid" ? styles.rowPaid : styles.rowPending]}
            onPress={() => handleTogglePaid(item)}
            onLongPress={() => handleDelete(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.users?.name ?? "Antrenör"}</Text>
              <Text style={styles.rowSub}>
                Vade: {formatDate(item.due_date)}
                {item.status === "paid" ? ` · Ödeme: ${formatDate(item.paid_at)}` : ""}
              </Text>
              {!!item.notes && <Text style={styles.rowNotes}>{item.notes}</Text>}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowAmount}>{formatTL(item.amount)}</Text>
              <Text style={[styles.badge, item.status === "paid" ? styles.badgePaid : styles.badgePending]}>
                {item.status === "paid" ? "Ödendi" : "Bekliyor"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  advanceButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  advanceButtonText: { color: colors.violet, fontWeight: "700", fontSize: 12 },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  summaryCard: {
    flexDirection: "row", gap: spacing.xl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md,
  },
  summarySubLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  summaryValue: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  filterRow: { flexDirection: "row", marginBottom: spacing.md, height: 32, flexGrow: 0, flexShrink: 0 },
  chip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, marginRight: spacing.xs,
    alignItems: "center", justifyContent: "center", height: 28, flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  chipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowPending: { borderColor: colors.yellow },
  rowPaid: { borderColor: colors.teal },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowNotes: { color: colors.muted, fontSize: 11, marginTop: 2, fontStyle: "italic" },
  rowAmount: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  badge: { fontSize: 10, fontWeight: "700", marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, overflow: "hidden" },
  badgePending: { color: colors.bg, backgroundColor: colors.yellow },
  badgePaid: { color: colors.bg, backgroundColor: colors.teal },
});
