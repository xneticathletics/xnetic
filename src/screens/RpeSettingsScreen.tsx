import React from "react";
import {
  View, Text, TextInput, Switch, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Field } from "../components/SettingsField";
import { useClubSettingsForm } from "../hooks/useClubSettingsForm";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

// Gelişmiş Ayarlar → Antrenman Zorluk Derecesi. VARSAYILAN OLARAK AÇIK;
// kapatılırsa sporculara bildirim gitmez ve antrenman detayındaki değerlendirme
// kutusu görünmez (bkz. send_session_rpe_reminders).
export default function RpeSettingsScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const { form, setField, setBool, handleSave, loading, saving, error } = useClubSettingsForm();

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
        {/* ---- Zorluk Derecesi (RPE) ---- */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconBadge, { backgroundColor: colors.yellowSoft }]}>
              <Text style={styles.iconText}>💪</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Antrenman Zorluk Derecesi</Text>
              <Text style={styles.cardStatus}>{form.rpe_enabled ? "Açık" : "Kapalı"}</Text>
            </View>
            <Switch
              value={form.rpe_enabled}
              onValueChange={(v) => setBool("rpe_enabled", v)}
              trackColor={{ false: colors.line, true: colors.yellowSoft }}
              thumbColor={form.rpe_enabled ? colors.yellow : colors.muted}
            />
          </View>
        </View>

        {form.rpe_enabled && (
          <Field
            label="Antrenman Bitiminden Sonra Kaç Dakika Açık Kalsın"
            hint="Antrenman bittiği anda sporcuya bildirim gider; bu süre dolunca değerlendirme kapanır. (5-720 dk)"
          >
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={String(form.rpe_window_minutes)}
              onChangeText={(v) => setField("rpe_window_minutes", v)}
              keyboardType="numeric"
            />
          </Field>
        )}

        <Text style={styles.infoBox}>
          Zorluk derecesi, sporcunun antrenmanı ne kadar zorlayıcı bulduğunu 1-10 arası puanlamasıdır; antrenörün
          yüklenmeyi takip etmesini sağlar. Kapatırsan sporculara bildirim gitmez ve antrenman detayındaki
          değerlendirme kutusu görünmez.
        </Text>

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
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBadge: {
    width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center",
  },
  iconText: { fontSize: 20 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  cardStatus: { color: colors.muted, fontSize: 12, marginTop: 2 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md,
  },
  error: { color: colors.coral, marginTop: spacing.md },
  saveButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl,
  },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
