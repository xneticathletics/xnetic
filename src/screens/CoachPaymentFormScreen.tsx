import React, { useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createCoachPaymentPlan } from "../lib/api/coachPaymentPlans";
import { listCoaches, type Coach } from "../lib/api/coaches";
import CoachPickerModal from "../components/CoachPickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachPaymentForm">;

export default function CoachPaymentFormScreen({ navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachPickerVisible, setCoachPickerVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı ödeme planını
  // iki kez oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listCoaches().then(setCoaches).catch(() => {});
    }, [])
  );

  const selectedCoach = coaches.find((c) => c.id === coachId) ?? null;

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!coachId) return Alert.alert("Eksik bilgi", "Bir antrenör seçmelisin.", [{ text: "Tamam" }]);
    const amt = Number(amount);
    if (!amt || amt <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir tutar girmelisin.", [{ text: "Tamam" }]);
    const day = Number(dayOfMonth);
    if (!day || day < 1 || day > 31) {
      return Alert.alert("Eksik bilgi", "Ayın günü 1 ile 31 arasında olmalı.", [{ text: "Tamam" }]);
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createCoachPaymentPlan({ coach_id: coachId, amount: amt, day_of_month: day });
      Alert.alert(
        "Ödeme Planı Oluşturuldu",
        "İlk ödeme bir sonraki ay için oluşturuldu (bu ay için ödeme kaydı açılmadı). Her yeni ay geldiğinde o ayın kaydı otomatik eklenmeye devam edecek.",
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.infoBox}>
          Burada gireceğin tutar ve gün, her ay otomatik olarak tekrarlanan bir
          antrenör ödeme planı oluşturur. İlk ödeme, planın oluşturulduğu ay
          değil, bir SONRAKİ ay olarak ayarlanır; o ayın "bekliyor" kaydı hemen
          hazırlanır, süre ilerledikçe yeni aylar kendiliğinden eklenir.
          Ödeme yapıldıkça Antrenör Ödemeleri listesinden "Ödendi" olarak
          işaretleyebilirsin.
        </Text>

        <Field label="Antrenör *">
          <TouchableOpacity style={styles.input} onPress={() => setCoachPickerVisible(true)}>
            <Text style={{ color: selectedCoach ? colors.ink : colors.muted }}>
              {selectedCoach ? selectedCoach.name : "Antrenör seç..."}
            </Text>
          </TouchableOpacity>
        </Field>

        <Field label="Aylık Tutar (₺) *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="5000"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Ayın Kaçında? (1-31) *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={dayOfMonth}
            onChangeText={setDayOfMonth}
            keyboardType="numeric"
            placeholder="Örn. 5"
            placeholderTextColor={colors.muted}
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Ödeme Planı Oluştur</Text>}
        </TouchableOpacity>

        <CoachPickerModal
          visible={coachPickerVisible}
          title="Antrenör Seç"
          coaches={coaches}
          onSelect={setCoachId}
          onClose={() => setCoachPickerVisible(false)}
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
  saveButton: { backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
