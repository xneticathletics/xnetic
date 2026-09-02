import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Field } from "../components/SettingsField";
import { useClubSettingsForm } from "../hooks/useClubSettingsForm";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

export default function AnnouncementSettingsScreen() {
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
          label="Ana Sayfa Önizlemesi — Duyuru Kaç Gün Görünsün"
          hint="Ana Sayfa'daki kısa duyuru önizlemesi için."
        >
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={String(form.announcement_home_preview_days)}
            onChangeText={(v) => setField("announcement_home_preview_days", v)}
            keyboardType="numeric"
          />
        </Field>

        <Field
          label="Duyurular Listesi — Duyuru Kaç Gün Görünsün"
          hint="Profil → Duyurular'daki tam liste için."
        >
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={String(form.announcement_visibility_days)}
            onChangeText={(v) => setField("announcement_visibility_days", v)}
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
