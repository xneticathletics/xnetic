import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createInjury, type InjuryInput } from "../lib/api/injuries";
import type { HomeStackParamList } from "../navigation/HomeStack";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
type Props = NativeStackScreenProps<HomeStackParamList, "InjuryForm">;

export default function InjuryFormScreen({ route, navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const { athleteId, athleteName } = route.params;

  const [form, setForm] = useState<Omit<InjuryInput, "athlete_id">>({
    injury_type: "",
    injury_date: new Date().toISOString().slice(0, 10),
    expected_return: null,
    note: null,
  });
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı sakatlığı iki
  // kez oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.injury_type.trim()) {
      Alert.alert("Eksik bilgi", "Sakatlık türü zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createInjury({ ...form, athlete_id: athleteId });
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
      <Text style={styles.subtitle}>{athleteName}</Text>

      <Field label="Sakatlık Türü *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.injury_type}
          onChangeText={(v) => set("injury_type", v)}
          placeholder="Örn. Ayak bileği burkulması"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Tarih (YYYY-AA-GG) *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.injury_date}
          onChangeText={(v) => set("injury_date", v)}
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Tahmini Dönüş Tarihi (YYYY-AA-GG)">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.expected_return ?? ""}
          onChangeText={(v) => set("expected_return", v || null)}
          placeholder="Bilinmiyorsa boş bırak"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Not">
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
          value={form.note ?? ""}
          onChangeText={(v) => set("note", v || null)}
          multiline
          placeholderTextColor={colors.muted}
        />
      </Field>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Sakatlığı Bildir</Text>}
      </TouchableOpacity>
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
  subtitle: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.coral, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
