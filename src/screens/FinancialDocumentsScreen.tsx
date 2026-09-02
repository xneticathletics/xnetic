import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { colors, radius, spacing } from "../theme/tokens";
import { listClubPayments, type Payment } from "../lib/api/payments";
import { listExpenses, deleteExpense, type Expense } from "../lib/api/expenses";
import { listExtraIncome, deleteExtraIncome, type ExtraIncome } from "../lib/api/extraIncome";
import { listCoachPayments, type CoachPayment } from "../lib/api/coachPayments";
import { getFinancePeriodRange } from "../lib/api/financeSummary";
import { useClubSettings } from "../context/ClubSettingsContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import DatePickerModal from "../components/DatePickerModal";

type Props = NativeStackScreenProps<HomeStackParamList, "FinancialDocuments">;

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

type DocItem =
  | { kind: "income"; date: string; data: Payment }
  | { kind: "extraIncome"; date: string; data: ExtraIncome }
  | { kind: "expense"; date: string; data: Expense }
  | { kind: "coachPayment"; date: string; data: CoachPayment };

function formatTL(n: number) {
  return `${n.toLocaleString("tr-TR")} ₺`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function FinancialDocumentsScreen({ navigation }: Props) {
  const { settings } = useClubSettings();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [extraIncome, setExtraIncome] = useState<ExtraIncome[]>([]);
  const [coachPayments, setCoachPayments] = useState<CoachPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<"start" | "end" | null>(null);

  const hasLoadedOnceRef = useRef(false);
  // Varsayılan tarih aralığı: "finans dönemi" başlangıç gününden bugüne —
  // sadece BİR KEZ (ilk açılışta) uygulanır, kullanıcı isterse geriye
  // dönük olarak serbestçe değiştirebilir.
  const hasSetDefaultRangeRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [allPayments, allExpenses, allExtraIncome, allCoachPayments] = await Promise.all([
        listClubPayments(), listExpenses(), listExtraIncome(), listCoachPayments(),
      ]);
      // Finansal Dökümanlarım = geçmişte fiilen YAPILMIŞ (ödenmiş) aidatların,
      // aidat dışı gelirlerin (forma/malzeme satışı vb.), girilen giderlerin
      // ve fiilen ÖDENMİŞ antrenör ödemelerinin dökümü — bekleyen/vadesi
      // geçmiş kayıtlar burada değil, ilgili Genel Bakış ekranlarında yönetiliyor.
      setPayments(allPayments.filter((p) => p.status === "paid"));
      setExpenses(allExpenses);
      setExtraIncome(allExtraIncome);
      setCoachPayments(allCoachPayments.filter((c) => c.status === "paid"));
    } catch (e: any) {
      setError(e.message ?? "Veriler yüklenemedi");
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

  useEffect(() => {
    if (hasSetDefaultRangeRef.current) return;
    const range = getFinancePeriodRange(settings.finance_period_start_day);
    setStartDate(range.start);
    setEndDate(range.end);
    hasSetDefaultRangeRef.current = true;
  }, [settings.finance_period_start_day]);

  const items = useMemo<DocItem[]>(() => {
    const income: DocItem[] = payments.map((p) => ({ kind: "income", date: (p.paid_at ?? p.due_date).slice(0, 10), data: p }));
    const extra: DocItem[] = extraIncome.map((e) => ({ kind: "extraIncome", date: e.income_date, data: e }));
    const expense: DocItem[] = expenses.map((e) => ({ kind: "expense", date: e.expense_date, data: e }));
    const coachPay: DocItem[] = coachPayments.map((c) => ({ kind: "coachPayment", date: (c.paid_at ?? c.due_date).slice(0, 10), data: c }));
    return [...income, ...extra, ...expense, ...coachPay];
  }, [payments, extraIncome, expenses, coachPayments]);

  const filtered = useMemo(() => {
    let list = items;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        if (item.kind === "income") return (item.data.athletes?.full_name ?? "").toLowerCase().includes(q);
        if (item.kind === "coachPayment") {
          const coachName = item.data.users?.name ?? "";
          return coachName.toLowerCase().includes(q) || (item.data.notes ?? "").toLowerCase().includes(q);
        }
        return item.data.description.toLowerCase().includes(q);
      });
    }
    if (startDate) list = list.filter((item) => item.date >= startDate);
    if (endDate) list = list.filter((item) => item.date <= endDate);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [items, query, startDate, endDate]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((item) => {
      if (item.kind === "expense" || item.kind === "coachPayment") expense += Number(item.data.amount);
      else income += Number(item.data.amount);
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleDeleteExpense = (item: Expense) => {
    Alert.alert(
      "Gideri sil",
      `"${item.description}" (${formatTL(item.amount)}) gider kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(item.id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  const handleDeleteExtraIncome = (item: ExtraIncome) => {
    Alert.alert(
      "Geliri sil",
      `"${item.description}" (${formatTL(item.amount)}) gelir kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExtraIncome(item.id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (filtered.length === 0) {
      Alert.alert("Aktarılacak kayıt yok", "Seçili filtrelerle eşleşen kayıt bulunamadı.", [{ text: "Tamam" }]);
      return;
    }
    setExporting(true);
    try {
      const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const header = ["Tür", "Açıklama", "Branş", "Tutar (₺)", "Tarih"].join(";");
      const rows = filtered.map((item) => {
        const isAidat = item.kind === "income";
        const description = isAidat
          ? `${item.data.athletes?.full_name ?? "—"} — ${PERIOD_LABEL[item.data.period] ?? item.data.period} Aidat`
          : item.kind === "coachPayment"
          ? `${item.data.users?.name ?? "—"} — Antrenör Ödemesi${item.data.notes ? ` (${item.data.notes})` : ""}`
          : item.data.description;
        const branch = isAidat ? item.data.athletes?.groups?.branch ?? "" : "";
        const typeLabel = item.kind === "expense" || item.kind === "coachPayment" ? "Gider" : "Gelir";
        return [typeLabel, description, branch, item.data.amount.toString().replace(".", ","), formatDate(item.date)]
          .map((v) => escapeCsv(String(v)))
          .join(";");
      });
      // Excel'in Türkçe karakterleri doğru göstermesi için UTF-8 BOM ekleniyor.
      const csv = "﻿" + [header, ...rows].join("\n");
      const fileUri = `${FileSystem.cacheDirectory}finansal-dokumanlar-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Finansal Dökümanları Kaydet / Paylaş",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Paylaşım kullanılamıyor", "Bu cihazda dosya paylaşımı desteklenmiyor.", [{ text: "Tamam" }]);
      }
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Dışa aktarılamadı", [{ text: "Tamam" }]);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.exportButtonText}>📥 Excel'e Aktar</Text>
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Sporcu, antrenör, gelir ya da gider açıklaması ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateChip} onPress={() => setPickerOpen("start")}>
          <Text style={styles.dateChipLabel}>Başlangıç</Text>
          <Text style={styles.dateChipValue}>{startDate ? formatDate(startDate) : "Seçilmedi"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateChip} onPress={() => setPickerOpen("end")}>
          <Text style={styles.dateChipLabel}>Bitiş</Text>
          <Text style={styles.dateChipValue}>{endDate ? formatDate(endDate) : "Seçilmedi"}</Text>
        </TouchableOpacity>
        {(startDate || endDate) && (
          <TouchableOpacity style={styles.clearButton} onPress={() => { setStartDate(null); setEndDate(null); }}>
            <Text style={styles.clearButtonText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summarySubLabel}>Gelir</Text>
          <Text style={[styles.summaryValue, { color: colors.teal }]}>{formatTL(totals.income)}</Text>
        </View>
        <View>
          <Text style={styles.summarySubLabel}>Gider</Text>
          <Text style={[styles.summaryValue, { color: colors.coral }]}>{formatTL(totals.expense)}</Text>
        </View>
        <View>
          <Text style={styles.summarySubLabel}>Toplam</Text>
          <Text style={[styles.summaryValue, { color: colors.yellow }]}>{formatTL(totals.net)}</Text>
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Eşleşen kayıt bulunamadı.</Text> : null}
        renderItem={({ item }) => {
          if (item.kind === "coachPayment") {
            const c = item.data;
            return (
              <View style={styles.expenseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{c.users?.name ?? "Antrenör"}</Text>
                  <Text style={styles.rowSub}>Antrenör Ödemesi · {formatDate(item.date)}</Text>
                </View>
                <Text style={styles.expenseAmount}>-{formatTL(c.amount)}</Text>
              </View>
            );
          }
          if (item.kind === "expense") {
            const e = item.data;
            return (
              <TouchableOpacity style={styles.expenseRow} onPress={() => handleDeleteExpense(e)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{e.description}</Text>
                  <Text style={styles.rowSub}>Gider · {formatDate(e.expense_date)}</Text>
                </View>
                <Text style={styles.expenseAmount}>-{formatTL(e.amount)}</Text>
              </TouchableOpacity>
            );
          }
          if (item.kind === "extraIncome") {
            const e = item.data;
            return (
              <TouchableOpacity style={styles.extraIncomeRow} onPress={() => handleDeleteExtraIncome(e)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{e.description}</Text>
                  <Text style={styles.rowSub}>Gelir · {formatDate(e.income_date)}</Text>
                </View>
                <Text style={styles.rowAmount}>+{formatTL(e.amount)}</Text>
              </TouchableOpacity>
            );
          }
          const p = item.data;
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>
                  {p.athletes?.full_name ?? "—"}
                  {p.athletes?.groups?.branch ? <Text style={styles.rowBranch}> · {p.athletes.groups.branch}</Text> : null}
                </Text>
                <Text style={styles.rowSub}>
                  {PERIOD_LABEL[p.period]} · Vade: {formatDate(p.due_date)} · Ödeme: {formatDate(p.paid_at)}
                </Text>
              </View>
              <Text style={styles.rowAmount}>+{formatTL(p.amount)}</Text>
            </View>
          );
        }}
      />

      <DatePickerModal
        visible={pickerOpen !== null}
        selectedDate={pickerOpen === "start" ? startDate : endDate}
        onSelect={(d) => (pickerOpen === "start" ? setStartDate(d) : setEndDate(d))}
        onClose={() => setPickerOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
  exportButton: {
    backgroundColor: colors.teal, borderRadius: radius.sm, paddingHorizontal: spacing.md,
    paddingVertical: 10, minWidth: 130, alignItems: "center", justifyContent: "center",
  },
  exportButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  dateRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  dateChip: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  dateChipLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  dateChipValue: { color: colors.ink, fontSize: 13, fontWeight: "600", marginTop: 2 },
  clearButton: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  clearButtonText: { color: colors.coral, fontWeight: "700", fontSize: 12 },
  summaryCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm,
  },
  summarySubLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  summaryValue: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  expenseRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.coral,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  extraIncomeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  rowBranch: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowAmount: { color: colors.teal, fontSize: 14, fontWeight: "700", marginLeft: spacing.sm },
  expenseAmount: { color: colors.coral, fontSize: 14, fontWeight: "700", marginLeft: spacing.sm },
});
