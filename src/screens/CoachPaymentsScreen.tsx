import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listCoachPayments, markCoachPaymentPaid, markCoachPaymentPending, deleteCoachPayment, type CoachPayment,
} from "../lib/api/coachPayments";
import { topUpAllActiveCoachPlans } from "../lib/api/coachPaymentPlans";
import type { HomeStackParamList } from "../navigation/HomeStack";
import FilterChipRow from "../components/FilterChipRow";
import CoachPickerModal from "../components/CoachPickerModal";

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
  // Antrenör seçimi: null = tüm antrenörler. Seçilince hem liste hem
  // yukarıdaki Bekleyen/Ödenen toplamları sadece o antrenörü gösterir.
  const [coachFilter, setCoachFilter] = useState<string | null>(null);
  const [coachPickerOpen, setCoachPickerOpen] = useState(false);
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

  // Açılır listedeki antrenörler, yüklenmiş ödeme kayıtlarından türetiliyor
  // — ayrı bir sorgu gerekmiyor ve listede yalnızca gerçekten ödeme kaydı
  // olan antrenörler çıkıyor.
  const coaches = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    payments.forEach((p) => {
      if (!byId.has(p.coach_id)) byId.set(p.coach_id, { id: p.coach_id, name: p.users?.name ?? "Antrenör" });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [payments]);

  const selectedCoachName = coachFilter ? coaches.find((c) => c.id === coachFilter)?.name ?? null : null;

  // Antrenör seçimi önce uygulanır; durum filtresi ve toplamlar hep bu
  // daraltılmış küme üzerinden hesaplanır.
  const coachScoped = useMemo(
    () => (coachFilter ? payments.filter((p) => p.coach_id === coachFilter) : payments),
    [payments, coachFilter]
  );

  const totals = useMemo(() => {
    let pending = 0;
    let paid = 0;
    coachScoped.forEach((p) => {
      if (p.status === "paid") paid += Number(p.amount);
      else pending += Number(p.amount);
    });
    return { pending, paid };
  }, [coachScoped]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? coachScoped : coachScoped.filter((p) => p.status === statusFilter)),
    [coachScoped, statusFilter]
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

      <TouchableOpacity
        style={styles.coachSelect}
        activeOpacity={0.8}
        onPress={() => setCoachPickerOpen(true)}
        disabled={coaches.length === 0}
      >
        <Text style={styles.coachSelectLabel}>Antrenör</Text>
        <Text style={styles.coachSelectValue} numberOfLines={1}>
          {selectedCoachName ?? "Tüm Antrenörler"}
        </Text>
        <Text style={styles.coachSelectChevron}>⌄</Text>
      </TouchableOpacity>

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

      <FilterChipRow
        options={[
          { key: "all", label: "Tümü" },
          { key: "pending", label: "Bekleyen" },
          { key: "paid", label: "Ödendi" },
        ]}
        activeKey={statusFilter}
        onSelect={(key) => setStatusFilter(key as StatusFilter)}
        activeColor={colors.violet}
        style={styles.filterRow}
        showScrollHint
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Kayıt bulunamadı.</Text> : null}
        renderItem={({ item }) => (
          <View style={[styles.row, item.status === "paid" ? styles.rowPaid : styles.rowPending]}>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row" }} onPress={() => handleTogglePaid(item)}>
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
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              accessibilityLabel="Ödeme kaydını sil"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: spacing.sm }}
            >
              <Text style={styles.rowDeleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <CoachPickerModal
        visible={coachPickerOpen}
        title="Antrenör Seç"
        coaches={coaches}
        clearLabel="Tüm Antrenörler"
        onSelect={setCoachFilter}
        onClose={() => setCoachPickerOpen(false)}
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
  filterRow: { marginBottom: spacing.md },
  coachSelect: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    marginBottom: spacing.md,
  },
  coachSelectLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  coachSelectValue: { color: colors.ink, fontSize: 14, fontWeight: "700", flex: 1, textAlign: "right" },
  coachSelectChevron: { color: colors.violet, fontSize: 16, fontWeight: "700", marginTop: -4 },
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
  rowDeleteIcon: { fontSize: 15 },
});
