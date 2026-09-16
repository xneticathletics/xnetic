import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createPaymentPlan } from "../lib/api/paymentPlans";
import { getClubSettings } from "../lib/api/clubSettings";
import type { Athlete } from "../lib/api/athletes";
import AthletePickerModal from "../components/AthletePickerModal";
import DateMaskInput from "../components/DateMaskInput";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useAuth } from "../context/AuthContext";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
type Props = NativeStackScreenProps<HomeStackParamList, "PaymentForm">;

export default function PaymentFormScreen({ route, navigation }: Props) {
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const preselected = route.params;
  const [athleteId, setAthleteId] = useState<string | null>(preselected?.athleteId ?? null);
  const [athleteName, setAthleteName] = useState<string | null>(preselected?.athleteName ?? null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [firstPaymentDate, setFirstPaymentDate] = useState<string | null>(null);
  // athleteId dahil değil — navigation param'ından ön-seçili gelebiliyor,
  // dahil edilirse bazı akışlarda hiç dokunmadan "değişti" sayılırdı.
  const hasUnsavedChanges = !!amount.trim() || !!firstPaymentDate;
  const { markSaved } = useUnsavedChangesGuard(navigation, hasUnsavedChanges);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı aidat planını
  // iki kez oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [monthsAhead, setMonthsAhead] = useState(3);

  useEffect(() => {
    if (!clubId) return;
    getClubSettings(clubId).then((s) => setMonthsAhead(s.payment_plan_months_ahead)).catch(() => {});
  }, [clubId]);
  const [error, setError] = useState<string | null>(null);

  const handleAthleteSelect = (a: Athlete) => {
    setAthleteId(a.id);
    setAthleteName(a.full_name);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!athleteId) return Alert.alert("Eksik bilgi", "Sporcu seçmelisin.", [{ text: "Tamam" }]);
    if (!amount || Number(amount) <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir tutar gir.", [{ text: "Tamam" }]);
    if (!firstPaymentDate) {
      return Alert.alert("Eksik bilgi", "İlk ödeme tarihini seçmelisin.", [{ text: "Tamam" }]);
    }
    // 29-31 gibi her ayda bulunmayan günler için computeDueDate()
    // (paymentPlans.ts) o ayın son gününe otomatik sığdırır.

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createPaymentPlan({ athlete_id: athleteId, amount: Number(amount), first_payment_date: firstPaymentDate });
      Alert.alert(
        "Aidat Planı Oluşturuldu",
        "İlk ödeme seçtiğin tarih için oluşturuldu. Önümüzdeki 3 ay için kayıtlar hazır; zaman geçtikçe yeni aylar otomatik eklenmeye devam edecek.",
        [{ text: "Tamam" }]
      );
      markSaved();
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.infoBox}>
        Burada gireceğin tutar ve seçtiğin ilk ödeme tarihi, her ay otomatik
        olarak tekrarlanan bir aidat planı oluşturur. Önümüzdeki 3 ay için
        ödeme kaydı hemen hazırlanır, süre ilerledikçe yeni aylar
        kendiliğinden eklenir.
      </Text>

      <Field label="Sporcu *">
        <TouchableOpacity style={styles.input} onPress={() => setPickerVisible(true)}>
          <Text style={{ color: athleteName ? colors.ink : colors.muted }}>{athleteName ?? "Sporcu seç"}</Text>
        </TouchableOpacity>
      </Field>

      <Field label="Aylık Tutar (₺) *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="1500"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="İlk Ödeme Tarihi *">
        <DateMaskInput value={firstPaymentDate} onChange={setFirstPaymentDate} onFocus={handleFocus} />
      </Field>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Aidat Planı Oluştur</Text>}
      </TouchableOpacity>

      <AthletePickerModal
        visible={pickerVisible}
        selectedId={athleteId}
        onSelect={handleAthleteSelect}
        onClose={() => setPickerVisible(false)}
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
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
