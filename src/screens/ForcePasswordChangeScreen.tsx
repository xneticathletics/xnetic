import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { changeMyPasswordFirstLogin } from "../lib/api/currentUser";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { translatePasswordError } from "../lib/passwordErrors";

// Geçici şifreyle giriş yapan HERKESİN (rol fark etmez) ilk girişte
// düştüğü ekran — kendi şifresini belirlemeden hiçbir yere geçemez.
export default function ForcePasswordChangeScreen({ onComplete }: { onComplete: () => void }) {
  const { signOut } = useAuth();
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
      await changeMyPasswordFirstLogin(password);
      onComplete();
    } catch (e: any) {
      setError(translatePasswordError(e.message ?? ""));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <Text style={styles.title}>Hoş Geldin! 🔐</Text>
        <Text style={styles.subtitle}>
          Geçici bir şifreyle giriş yaptın. Uygulamayı kullanmaya başlamadan önce kendi şifreni belirlemen gerekiyor.
        </Text>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Yeni Şifre</Text>
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="En az 6 karakter"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry
            placeholderTextColor={colors.muted}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Şifreyi Belirle ve Devam Et</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut} disabled={saving}>
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: "center" },
  title: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 6, marginBottom: spacing.xl, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  signOutButton: { alignItems: "center", paddingVertical: spacing.md },
  signOutText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
});
