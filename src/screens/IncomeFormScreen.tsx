import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createExtraIncome } from "../lib/api/extraIncome";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "IncomeForm">;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function IncomeFormScreen({ navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(todayKey());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı geliri iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!description.trim()) return Alert.alert("Eksik bilgi", "Açıklama girmelisin.", [{ text: "Tamam" }]);
    const amt = Number(amount);
    if (!amt || amt <= 0) return Alert.alert("Eksik bilgi", "Geçerli bir tutar girmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createExtraIncome({ description: description.trim(), amount: amt, income_date: incomeDate });
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
          Aidat dışındaki gelirler için — forma/tişört satışı, branşa özgü malzeme satışı vb.
        </Text>

        <Field label="Açıklama *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Örn. Forma satışı, malzeme satışı..."
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Tutar (₺) *">
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

        <Field label="Tarih *">
          <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
            <Text style={{ color: colors.ink }}>{incomeDate}</Text>
          </TouchableOpacity>
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Geliri Kaydet</Text>}
        </TouchableOpacity>

        <DatePickerModal
          visible={datePickerVisible}
          selectedDate={incomeDate}
          onSelect={setIncomeDate}
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
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
