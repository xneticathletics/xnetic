import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { completePasswordReset } from "../lib/api/passwordReset";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { translatePasswordError } from "../lib/passwordErrors";

export default function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSubmit iki kez çalışabiliyordu. Senkron
  // bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (savingRef.current) return;
    if (password.length < 6) {
      Alert.alert("Eksik bilgi", "Şifre en az 6 karakter olmalı.", [{ text: "Tamam" }]);
      return;
    }
    if (password !== password2) {
      Alert.alert("Eksik bilgi", "Şifreler eşleşmiyor.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await completePasswordReset(password);
      Alert.alert("Kaydedildi", "Yeni şifren belirlendi.", [{ text: "Tamam", onPress: onDone }]);
    } catch (e: any) {
      setError(translatePasswordError(e.message ?? ""));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>Hesabın için yeni bir şifre gir.</Text>

        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          placeholder="Yeni şifre (en az 6 karakter)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          placeholder="Yeni şifre (tekrar)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password2}
          onChangeText={setPassword2}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Şifreyi Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  title: { color: colors.ink, fontSize: 24, fontWeight: "700", marginBottom: spacing.xs, textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: spacing.xl, textAlign: "center" },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 14, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md, fontSize: 13 },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
