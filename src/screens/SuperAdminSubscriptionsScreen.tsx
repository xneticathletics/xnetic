import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllSubscriptions, upsertSubscription, type SubscriptionRow } from "../lib/api/superAdmin";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminSubscriptions">;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "mock_paid", label: "Test Ödemesi" },
  { value: "past_due", label: "Ödeme Gecikti" },
  { value: "cancelled", label: "İptal Edildi" },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
];
const PERIOD_LABELS: Record<string, string> = Object.fromEntries(PERIOD_OPTIONS.map((o) => [o.value, o.label]));

export default function SuperAdminSubscriptionsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const [editStatus, setEditStatus] = useState("active");
  const [editPeriod, setEditPeriod] = useState("monthly");
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listAllSubscriptions()
      .then(setRows)
      .catch((e: any) => setError(e.message ?? "Abonelikler yüklenemedi"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const openEdit = (row: SubscriptionRow) => {
    setEditing(row);
    setEditStatus(row.status === "none" ? "active" : row.status);
    setEditPeriod(row.billing_period);
    setEditAmount(row.amount_try ? String(row.amount_try) : "");
    setFormError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    const amount = Number(editAmount);
    if (!editAmount.trim() || Number.isNaN(amount) || amount < 0) {
      setFormError("Geçerli bir tutar gir.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await upsertSubscription({
        id: editing.id || undefined,
        club_id: editing.club_id,
        billing_period: editPeriod,
        status: editStatus,
        amount_try: amount,
      });
      setEditing(null);
      await load();
    } catch (e: any) {
      setFormError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Kulüplerin abonelik durumunu buradan yönetebilirsin — bir karta dokun.</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={rows}
        keyExtractor={(r) => r.club_id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz kulüp yok.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.club_name}</Text>
              {item.status === "none" ? (
                <Text style={styles.noSub}>Abonelik kaydı yok — dokunup oluştur</Text>
              ) : (
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{PERIOD_LABELS[item.billing_period] ?? item.billing_period}</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeStatus]}>
                    <Text style={styles.badgeText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                  </View>
                  <Text style={styles.amountText}>₺{item.amount_try.toLocaleString("tr-TR")}</Text>
                </View>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>{editing?.club_name}</Text>

            <Text style={styles.fieldLabel}>Durum</Text>
            <View style={styles.chipGrid}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, editStatus === opt.value && styles.chipActive]}
                  onPress={() => setEditStatus(opt.value)}
                >
                  <Text style={[styles.chipText, editStatus === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Plan</Text>
            <View style={styles.chipGrid}>
              {PERIOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, editPeriod === opt.value && styles.chipActive]}
                  onPress={() => setEditPeriod(opt.value)}
                >
                  <Text style={[styles.chipText, editPeriod === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="999"
              placeholderTextColor={colors.muted}
            />

            {formError && <Text style={styles.error}>{formError}</Text>}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setEditing(null)} disabled={saving}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs, flexWrap: "wrap" },
  badge: { backgroundColor: `${colors.violet}22`, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeStatus: { backgroundColor: `${colors.teal}22` },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  amountText: { color: colors.yellow, fontSize: 12, fontWeight: "800" },
  noSub: { color: colors.coral, fontSize: 11, fontStyle: "italic", marginTop: 4 },
  chevron: { color: colors.yellow, fontSize: 20, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "80%",
  },
  modalTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: spacing.sm },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.bg },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  closeButton: { alignItems: "center", paddingVertical: spacing.md },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
