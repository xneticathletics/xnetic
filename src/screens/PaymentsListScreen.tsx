import React, { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listClubPayments, markPaymentPaid, isOverdue, getCurrentMonthRange, type Payment } from "../lib/api/payments";
import { topUpAllActivePlans } from "../lib/api/paymentPlans";
import { sendNotification } from "../lib/api/notifications";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "PaymentsList">;

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

const FILTER_META = {
  paid: { title: "Tahsil Edilenler", label: "TAHSİL EDİLEN AİDATLAR", color: colors.teal, soft: colors.tealSoft, empty: "Henüz tahsil edilmiş aidat yok." },
  pending: { title: "Bekleyen Aidatlar", label: "BEKLEYEN AİDATLAR", color: colors.yellow, soft: colors.yellowSoft, empty: "Bekleyen aidat yok." },
  overdue: { title: "Vadesi Geçmiş Aidatlar", label: "VADESİ GEÇMİŞ AİDATLAR", color: colors.coral, soft: colors.coralSoft, empty: "Gecikmiş ödeme yok." },
} as const;

export default function PaymentsListScreen({ route, navigation }: Props) {
  const { filter } = route.params;
  const meta = FILTER_META[filter];
  const { settings } = useClubSettings();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: meta.title });
  }, [meta.title, navigation]);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Ekran her açıldığında aktif planların önümüzdeki 3 aylık ufkunu
      // tazeler — zaman ne kadar geçmiş olursa olsun otomatik tamamlanır.
      await topUpAllActivePlans();
      const all = await listClubPayments();
      const graceDays = settings.payment_overdue_grace_days;
      // "Tahsil Edilen" ve "Bekleyen" listeleri, Finans ana ekranındaki
      // özet kartla AYNI ay penceresini (bu ayın 1'i - son günü) kullanır
      // — aksi halde aidat planı önümüzdeki aylar için de kayıt
      // oluşturduğundan "Bekleyen" listesi 3 ay birden gösterirdi.
      // "Vadesi Geçmiş" bilerek ay sınırı olmadan TÜM gecikmiş ödemeleri
      // gösterir (bkz. getMonthlyFinanceSummary'deki not).
      const { start, end } = getCurrentMonthRange();
      const filtered =
        filter === "paid"
          ? all.filter((p) => p.status === "paid" && p.due_date >= start && p.due_date <= end)
          : filter === "overdue"
          ? all.filter((p) => isOverdue(p, graceDays))
          : all.filter((p) => p.status === "pending" && !isOverdue(p, graceDays) && p.due_date >= start && p.due_date <= end);
      setPayments(filtered);
    } catch (e: any) {
      setError(e.message ?? "Ödemeler yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [filter, settings.payment_overdue_grace_days]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleMarkPaid = async (item: Payment) => {
    Alert.alert(
      "Ödendi olarak işaretle",
      `${item.athletes?.full_name ?? "Bu sporcu"} için ${item.amount.toLocaleString("tr-TR")} ₺ tutarındaki aidatı ödendi olarak işaretlemek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, İşaretle",
          onPress: async () => {
            try {
              await markPaymentPaid(item.id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "İşaretlenemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  const handleSendReminder = async (item: Payment) => {
    const recipientId = item.athletes?.parent_user_id;
    if (!recipientId) {
      Alert.alert(
        "Bağlı hesap yok",
        "Bu sporcunun bağlı bir veli/sporcu giriş hesabı yok — uyarı gönderilemedi. Sporcu Yönetimi'nden hesap bağlayabilirsin.",
        [{ text: "Tamam" }]
      );
      return;
    }
    setSendingId(item.id);
    try {
      await sendNotification(
        recipientId,
        "Aidat Hatırlatması",
        `${item.athletes?.full_name ?? "Sporcunuz"} için ${item.amount.toLocaleString("tr-TR")} ₺ tutarındaki aidatın vadesi (${item.due_date}) geçti. Lütfen en kısa sürede ödeme yapın.`,
        "payment_reminder"
      );
      Alert.alert("Gönderildi", "Uyarı bildirimi gönderildi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Gönderilemedi", [{ text: "Tamam" }]);
    } finally {
      setSendingId(null);
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <View style={styles.container}>
      <View style={[styles.overdueCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
        <Text style={[styles.overdueCardLabel, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.overdueCardAmount}>{totalAmount.toLocaleString("tr-TR")} ₺</Text>
        <Text style={[styles.overdueCardCount, { color: meta.color }]}>
          {payments.length > 0 ? `${payments.length} kayıt` : "Kayıt yok"}
        </Text>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={payments}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{meta.empty}</Text> : null}
        renderItem={({ item }) => {
          const overdue = isOverdue(item, settings.payment_overdue_grace_days);
          const statusLabel = item.status === "paid" ? "Ödendi" : overdue ? "Gecikmiş" : "Bekliyor";
          const statusColor = item.status === "paid" ? colors.teal : overdue ? colors.coral : colors.muted;
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>
                  {item.athletes?.full_name ?? "—"}
                  {item.athletes?.groups?.branch ? (
                    <Text style={styles.rowBranch}> · {item.athletes.groups.branch}</Text>
                  ) : null}
                </Text>
                <Text style={styles.rowSub}>
                  {PERIOD_LABEL[item.period]} · {item.amount.toLocaleString("tr-TR")} ₺ · Vade: {item.due_date}
                </Text>
                <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                {(item.athletes?.parent_name || item.athletes?.parent_phone) && (
                  <Text style={styles.parentInfo}>
                    {[item.athletes?.parent_name, item.athletes?.parent_phone].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
              {item.status !== "paid" && (
                <View style={styles.actionsCol}>
                  <TouchableOpacity style={styles.payButton} onPress={() => handleMarkPaid(item)}>
                    <Text style={styles.payButtonText}>Ödendi İşaretle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.remindButton}
                    onPress={() => handleSendReminder(item)}
                    disabled={sendingId === item.id}
                  >
                    {sendingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.yellow} />
                    ) : (
                      <Text style={styles.remindButtonText}>🔔 Uyarı Gönder</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  overdueCard: {
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  overdueCardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  overdueCardAmount: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 6 },
  overdueCardCount: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowBranch: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  parentInfo: { color: colors.muted, fontSize: 11, marginTop: 4 },
  actionsCol: { alignItems: "flex-end", gap: 6 },
  payButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  payButtonText: { color: colors.teal, fontWeight: "700", fontSize: 11 },
  remindButton: { borderWidth: 1, borderColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, minWidth: 110, alignItems: "center" },
  remindButtonText: { color: colors.yellow, fontWeight: "700", fontSize: 11 },
});
