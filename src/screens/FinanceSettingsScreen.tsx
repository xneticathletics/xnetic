import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Field } from "../components/SettingsField";
import { useClubSettingsForm } from "../hooks/useClubSettingsForm";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

export default function FinanceSettingsScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const { form, setField, handleSave, loading, saving, error } = useClubSettingsForm();

  if (loading || !form) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <Field
          label="Aidat Planı — Önümüzdeki Kaç Ay Otomatik Oluşturulsun"
          hint="Bir sporcuya aidat planı bağlandığında, bu kadar ay ileriye kadar ödeme kaydı otomatik hazırlanır."
        >
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={String(form.payment_plan_months_ahead)}
            onChangeText={(v) => setField("payment_plan_months_ahead", v)}
            keyboardType="numeric"
          />
        </Field>

        <Field
          label="Vadesi Geçen Ödeme — Kaç Gün Sonra 'Gecikmiş' Sayılsın"
          hint="0 = vade tarihi geçer geçmez hemen gecikmiş sayılır. Örn. 3 yaparsan vade tarihinden 3 gün sonrasına kadar bekler."
        >
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={String(form.payment_overdue_grace_days)}
            onChangeText={(v) => setField("payment_overdue_grace_days", v)}
            keyboardType="numeric"
          />
        </Field>

        <Field
          label="Finansal Dönem Başlangıç Günü (Ayın Kaçı)"
          hint="Finansal Dökümanlarım'daki varsayılan tarih aralığı, her ay bu günden bugüne kadar hesaplanır. Varsayılan 1 = takvim ayı."
        >
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={String(form.finance_period_start_day)}
            onChangeText={(v) => setField("finance_period_start_day", v)}
            keyboardType="numeric"
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
