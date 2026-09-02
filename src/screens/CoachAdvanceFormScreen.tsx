import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createCoachAdvance } from "../lib/api/coachAdvances";
import { listPendingCoachPaymentsFor, type CoachPayment } from "../lib/api/coachPayments";
import { listCoaches, type Coach } from "../lib/api/coaches";
import CoachPickerModal from "../components/CoachPickerModal";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachAdvanceForm">;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTL(n: number) {
  return `${Number(n).toLocaleString("tr-TR")} ₺`;
}

export default function CoachAdvanceFormScreen({ navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachPickerVisible, setCoachPickerVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [givenDate, setGivenDate] = useState(todayKey());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [note, setNote] = useState("");

  const [pendingPayments, setPendingPayments] = useState<CoachPayment[]>([]);
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı avansı iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      listCoaches().then(setCoaches).catch(() => {});
    }, [])
  );

  const selectedCoach = coaches.find((c) => c.id === coachId) ?? null;

  const handleSelectCoach = async (id: string | null) => {
    setCoachId(id);
    setDeductions({});
    setPendingPayments([]);
    if (!id) return;
    setLoadingPayments(true);
    try {
      setPendingPayments(await listPendingCoachPaymentsFor(id));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Ödemeler yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const toggleDeduction = (payment: CoachPayment) => {
    setDeductions((prev) => {
      const next = { ...prev };
      if (next[payment.id] != null) {
        delete next[payment.id];
      } else {
        next[payment.id] = String(payment.amount);
      }
      return next;
    });
  };

  const totalAllocated = Object.values(deductions).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const advanceAmount = Number(amount) || 0;

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!coachId) return Alert.alert("Eksik bilgi", "Bir antrenör seçmelisin.", [{ text: "Tamam" }]);
    if (!advanceAmount || advanceAmount <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir avans tutarı girmelisin.", [{ text: "Tamam" }]);

    const deductionList = Object.entries(deductions)
      .map(([paymentId, v]) => ({ coach_payment_id: paymentId, deducted_amount: Number(v) || 0 }))
      .filter((d) => d.deducted_amount > 0);

    if (deductionList.some((d) => {
      const payment = pendingPayments.find((p) => p.id === d.coach_payment_id);
      return payment && d.deducted_amount > Number(payment.amount);
    })) {
      return Alert.alert("Geçersiz tutar", "Bir ödemeden, o ödemenin tutarından fazla kesinti yapamazsın.", [{ text: "Tamam" }]);
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await createCoachAdvance(
        { coach_id: coachId, amount: advanceAmount, given_date: givenDate, note: note.trim() || null },
        deductionList
      );
      Alert.alert("Kaydedildi", "Avans kaydedildi ve seçilen ödeme(ler)den kesinti uygulandı.", [{ text: "Tamam" }]);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.infoBox}>
          Antrenöre verdiğin avansı kaydet, sonra hangi bekleyen maaş
          ödeme(ler)inden ne kadar kesileceğini aşağıdan seç. Seçtiğin
          ödemelerin tutarı otomatik olarak azaltılır.
        </Text>

        <Field label="Antrenör *">
          <TouchableOpacity style={styles.input} onPress={() => setCoachPickerVisible(true)}>
            <Text style={{ color: selectedCoach ? colors.ink : colors.muted }}>
              {selectedCoach ? selectedCoach.name : "Antrenör seç..."}
            </Text>
          </TouchableOpacity>
        </Field>

        <Field label="Avans Tutarı (₺) *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Tarih *">
          <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
            <Text style={{ color: colors.ink }}>{new Date(givenDate).toLocaleDateString("tr-TR")}</Text>
          </TouchableOpacity>
        </Field>

        <Field label="Not (isteğe bağlı)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Örn. Nakit elden verildi"
            placeholderTextColor={colors.muted}
          />
        </Field>

        {coachId && (
          <View style={styles.deductionBox}>
            <Text style={styles.deductionTitle}>Hangi Ödeme(ler)den Kesilsin?</Text>
            {loadingPayments ? (
              <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.md }} />
            ) : pendingPayments.length === 0 ? (
              <Text style={styles.deductionHint}>Bu antrenörün bekleyen ödemesi yok.</Text>
            ) : (
              pendingPayments.map((p) => {
                const checked = deductions[p.id] != null;
                return (
                  <View key={p.id} style={styles.deductionRow}>
                    <TouchableOpacity style={styles.deductionCheckRow} onPress={() => toggleDeduction(p)}>
                      <Text style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked ? "✓" : ""}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deductionDue}>Vade: {new Date(p.due_date).toLocaleDateString("tr-TR")}</Text>
                        <Text style={styles.deductionAmount}>{formatTL(p.amount)}</Text>
                      </View>
                    </TouchableOpacity>
                    {checked && (
                      <TextInput
                        onFocus={handleFocus}
                        style={styles.deductionInput}
                        value={deductions[p.id]}
                        onChangeText={(v) => setDeductions((prev) => ({ ...prev, [p.id]: v }))}
                        keyboardType="numeric"
                        placeholder="Kesinti tutarı"
                        placeholderTextColor={colors.muted}
                      />
                    )}
                  </View>
                );
              })
            )}
            {pendingPayments.length > 0 && (
              <Text style={[styles.deductionHint, totalAllocated !== advanceAmount && styles.deductionWarning]}>
                Dağıtılan: {formatTL(totalAllocated)} / Avans: {formatTL(advanceAmount)}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Avansı Kaydet</Text>}
        </TouchableOpacity>

        <CoachPickerModal
          visible={coachPickerVisible}
          title="Antrenör Seç"
          coaches={coaches}
          onSelect={handleSelectCoach}
          onClose={() => setCoachPickerVisible(false)}
        />
        <DatePickerModal
          visible={datePickerVisible}
          selectedDate={givenDate}
          onSelect={(d) => { setGivenDate(d); setDatePickerVisible(false); }}
          onClose={() => setDatePickerVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  saveButton: { backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  deductionBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  deductionTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: spacing.sm },
  deductionHint: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
  deductionWarning: { color: colors.coral, fontWeight: "600" },
  deductionRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm, marginTop: spacing.sm },
  deductionCheckRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line,
    textAlign: "center", textAlignVertical: "center", color: colors.bg, fontSize: 13, fontWeight: "700",
  },
  checkboxChecked: { backgroundColor: colors.violet, borderColor: colors.violet },
  deductionDue: { color: colors.muted, fontSize: 11 },
  deductionAmount: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  deductionInput: {
    marginTop: spacing.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    color: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: 13,
  },
});
