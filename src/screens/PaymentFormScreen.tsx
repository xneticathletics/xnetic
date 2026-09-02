import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createPaymentPlan } from "../lib/api/paymentPlans";
import { getClubSettings } from "../lib/api/clubSettings";
import type { Athlete } from "../lib/api/athletes";
import AthletePickerModal from "../components/AthletePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useAuth } from "../context/AuthContext";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
type Props = NativeStackScreenProps<HomeStackParamList, "PaymentForm">;

export default function PaymentFormScreen({ route, navigation }: Props) {
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const preselected = route.params;
  const [athleteId, setAthleteId] = useState<string | null>(preselected?.athleteId ?? null);
  const [athleteName, setAthleteName] = useState<string | null>(preselected?.athleteName ?? null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [feeDayOfMonth, setFeeDayOfMonth] = useState("");
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
    const day = Number(feeDayOfMonth);
    if (!feeDayOfMonth || isNaN(day) || day < 1 || day > 31) {
      return Alert.alert("Eksik bilgi", "Ayın günü 1 ile 31 arasında olmalı.", [{ text: "Tamam" }]);
    }
    // 29-31 gibi her ayda bulunmayan günler için computeDueDate()
    // (paymentPlans.ts) o ayın son gününe otomatik sığdırır.

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createPaymentPlan({ athlete_id: athleteId, amount: Number(amount), day_of_month: day });
      Alert.alert(
        "Aidat Planı Oluşturuldu",
        "İlk ödeme bir sonraki ay için oluşturuldu (bu ay için aidat kaydı açılmadı). Önümüzdeki 3 ay için kayıtlar hazır; zaman geçtikçe yeni aylar otomatik eklenmeye devam edecek.",
        [{ text: "Tamam" }]
      );
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
        Burada gireceğin tutar ve gün, her ay otomatik olarak tekrarlanan bir
        aidat planı oluşturur. İlk ödeme, planın oluşturulduğu ay değil, bir
        SONRAKİ ay olarak ayarlanır; önümüzdeki 3 ay için ödeme kaydı hemen
        hazırlanır, süre ilerledikçe yeni aylar kendiliğinden eklenir.
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

      <Field label="Ayın Kaçında *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={feeDayOfMonth}
          onChangeText={(v) => setFeeDayOfMonth(v.replace(/[^0-9]/g, "").slice(0, 2))}
          keyboardType="numeric"
          placeholder="Örn. 5"
          placeholderTextColor={colors.muted}
          maxLength={2}
        />
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
