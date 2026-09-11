import React, { useCallback, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listPlatformTransactions, createPlatformTransaction, deletePlatformTransaction, summarizePlatformTransactions,
  type PlatformTransaction, type PlatformTransactionType,
} from "../lib/api/platformFinance";
import { useHomeButton } from "../hooks/useHomeButton";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminFinance">;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function SuperAdminFinanceScreen({ navigation }: Props) {
  useHomeButton(navigation);

  const [rows, setRows] = useState<PlatformTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<PlatformTransactionType>("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayKey());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return listPlatformTransactions()
      .then(setRows)
      .catch((e: any) => setError(e.message ?? "Kayıtlar yüklenemedi"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const summary = useMemo(() => summarizePlatformTransactions(rows), [rows]);

  const handleAdd = async () => {
    const amountNum = Number(amount.replace(",", "."));
    if (!description.trim() || !amountNum || amountNum <= 0) {
      setError("Açıklama ve geçerli bir tutar girmelisin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createPlatformTransaction({
        type,
        amount_try: amountNum,
        description: description.trim(),
        category: category.trim() || null,
        transaction_date: date,
      });
      // Platformun TÜM işlem geçmişini yeniden çekmek yerine (load()),
      // yeni satırı yerinde ekliyoruz — tek bir kayıt eklendi diye tüm
      // listeyi baştan yüklemeye gerek yok.
      setRows((prev) => [created as PlatformTransaction, ...prev]);
      setDescription("");
      setAmount("");
      setCategory("");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: PlatformTransaction) => {
    Alert.alert("Kaydı sil", `"${row.description}" kaydını silmek istediğine emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePlatformTransaction(row.id);
            setRows((prev) => prev.filter((r) => r.id !== row.id));
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text style={styles.subtitle}>
              X-NETIC'in kendi işletme gelir/gider muhasebesi — kulüplerin finansıyla ilgisi yok.
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Toplam Gelir</Text>
                <Text style={[styles.summaryValue, { color: colors.teal }]}>
                  ₺{summary.totalIncome.toLocaleString("tr-TR")}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Toplam Gider</Text>
                <Text style={[styles.summaryValue, { color: colors.coral }]}>
                  ₺{summary.totalExpense.toLocaleString("tr-TR")}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Net</Text>
                <Text style={[styles.summaryValue, { color: summary.net >= 0 ? colors.ink : colors.coral }]}>
                  ₺{summary.net.toLocaleString("tr-TR")}
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Yeni Kayıt Ekle</Text>

              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeButton, type === "income" && styles.typeButtonIncomeActive]}
                  onPress={() => setType("income")}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: type === "income" }}
                >
                  <Text style={[styles.typeButtonText, type === "income" && styles.typeButtonTextActive]}>Gelir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === "expense" && styles.typeButtonExpenseActive]}
                  onPress={() => setType("expense")}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: type === "expense" }}
                >
                  <Text style={[styles.typeButtonText, type === "expense" && styles.typeButtonTextActive]}>Gider</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Açıklama *</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Örn. Aylık abonelik geliri"
                placeholderTextColor={colors.muted}
              />

              <Text style={styles.label}>Tutar (₺) *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
              />

              <Text style={styles.label}>Kategori</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Örn. Barındırma, Reklam"
                placeholderTextColor={colors.muted}
              />

              <Text style={styles.label}>Tarih</Text>
              <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
                <Text style={{ color: colors.ink }}>{formatDate(date)}</Text>
              </TouchableOpacity>

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity style={styles.saveButton} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Ekle</Text>}
              </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
            {!loading && rows.length > 0 && <Text style={styles.listTitle}>Kayıtlar</Text>}
          </>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz kayıt yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTopLine}>
                <Text style={[styles.rowType, { color: item.type === "income" ? colors.teal : colors.coral }]}>
                  {item.type === "income" ? "Gelir" : "Gider"}
                </Text>
                <Text style={styles.rowDate}>{formatDate(item.transaction_date)}</Text>
              </View>
              <Text style={styles.rowDescription}>{item.description}</Text>
              {!!item.category && <Text style={styles.rowCategory}>{item.category}</Text>}
            </View>
            <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
              <Text style={[styles.rowAmount, { color: item.type === "income" ? colors.teal : colors.coral }]}>
                {item.type === "income" ? "+" : "-"}₺{Number(item.amount_try).toLocaleString("tr-TR")}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={date}
        onSelect={setDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  summaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm,
  },
  summaryLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { fontSize: 15, fontWeight: "800", marginTop: 4 },
  formCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg,
  },
  formTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },
  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  typeButton: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 10, alignItems: "center",
  },
  typeButtonIncomeActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  typeButtonExpenseActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  typeButtonText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  typeButtonTextActive: { color: colors.bg },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginTop: spacing.md, fontSize: 13 },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  listTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.sm,
  },
  rowTopLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowType: { fontSize: 11, fontWeight: "800" },
  rowDate: { color: colors.muted, fontSize: 11 },
  rowDescription: { color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: 4 },
  rowCategory: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: "800" },
  deleteText: { color: colors.coral, fontSize: 12, fontWeight: "700" },
});
