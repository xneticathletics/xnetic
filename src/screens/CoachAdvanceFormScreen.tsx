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

  const advanceAmount = Number(amount) || 0;
  // Kesinti her zaman antrenörün sıradaki (en yakın vadeli) bekleyen
  // ödemesinden yapılır — listPendingCoachPaymentsFor due_date'e göre
  // artan sırayla döndüğü için ilk eleman "sıradaki maaş"tır.
  const nextPayment = pendingPayments[0] ?? null;
  const deductedFromNext = nextPayment ? Math.min(advanceAmount, Number(nextPayment.amount)) : 0;

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!coachId) return Alert.alert("Eksik bilgi", "Bir antrenör seçmelisin.", [{ text: "Tamam" }]);
    if (!advanceAmount || advanceAmount <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir avans tutarı girmelisin.", [{ text: "Tamam" }]);

    const deductionList = nextPayment && deductedFromNext > 0
      ? [{ coach_payment_id: nextPayment.id, deducted_amount: deductedFromNext }]
      : [];

    savingRef.current = true;
    setSaving(true);
    try {
      await createCoachAdvance(
        { coach_id: coachId, amount: advanceAmount, given_date: givenDate, note: note.trim() || null },
        deductionList
      );
      Alert.alert(
        "Kaydedildi",
        deductionList.length > 0 ? "Avans kaydedildi ve sıradaki ödemeden kesinti uygulandı." : "Avans kaydedildi.",
        [{ text: "Tamam" }]
      );
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
          Antrenöre verdiğin avansı kaydet — tutar otomatik olarak antrenörün
          sıradaki (en yakın vadeli) bekleyen ödemesinden düşülür.
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
            <Text style={styles.deductionTitle}>Sıradaki Ödemeden Kesinti</Text>
            {loadingPayments ? (
              <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.md }} />
            ) : !nextPayment ? (
              <Text style={styles.deductionHint}>Bu antrenörün bekleyen ödemesi yok, avans kesintisiz kaydedilecek.</Text>
            ) : (
              <>
                <Text style={styles.deductionDue}>Vade: {new Date(nextPayment.due_date).toLocaleDateString("tr-TR")}</Text>
                <Text style={styles.deductionAmount}>{formatTL(nextPayment.amount)}</Text>
                {advanceAmount > 0 && (
                  <Text style={[styles.deductionHint, advanceAmount > Number(nextPayment.amount) && styles.deductionWarning]}>
                    {advanceAmount > Number(nextPayment.amount)
                      ? `Avans tutarı bu ödemeden büyük, kesinti ${formatTL(deductedFromNext)} ile sınırlı kalacak.`
                      : `Kesinti sonrası bu ödeme: ${formatTL(Number(nextPayment.amount) - deductedFromNext)}`}
                  </Text>
                )}
              </>
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
  deductionDue: { color: colors.muted, fontSize: 11 },
  deductionAmount: { color: colors.ink, fontSize: 14, fontWeight: "600" },
});
