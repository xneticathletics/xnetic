import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { supabase } from "../lib/supabase";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { translatePasswordError } from "../lib/passwordErrors";

export default function ChangePasswordScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [changing, setChanging] = useState(false);
  // TouchableOpacity'nin disabled={changing} kontrolü, setChanging(true)
  // state güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu
  // engelleyemiyor — hızlı çift dokunuşta handleChangePassword iki kez
  // çalışabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const changingRef = useRef(false);

  const handleChangePassword = async () => {
    if (changingRef.current) return;
    if (!oldPassword) {
      Alert.alert("Eksik bilgi", "Mevcut şifreni girmelisin.", [{ text: "Tamam" }]);
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Eksik bilgi", "Yeni şifre en az 6 karakter olmalı.", [{ text: "Tamam" }]);
      return;
    }
    if (newPassword !== newPassword2) {
      Alert.alert("Eksik bilgi", "Yeni şifreler eşleşmiyor.", [{ text: "Tamam" }]);
      return;
    }
    changingRef.current = true;
    setChanging(true);
    try {
      // supabase.auth.updateUser({password}) mevcut şifreyi hiç sormuyor —
      // oturumu açıkken herkes (ör. telefonunu kısa süreliğine bırakan
      // biri) şifreyi değiştirebilirdi. Önce mevcut şifreyle YENİDEN giriş
      // yaparak (re-authenticate) doğrulama yapıyoruz — yanlışsa burada hata
      // alınır ve şifre hiç değiştirilmez.
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (userError || !email) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yap.");

      const { error: reAuthError } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
      if (reAuthError) throw new Error("Mevcut şifren yanlış.");

      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) throw pwError;

      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
      Alert.alert("Kaydedildi", "Şifren değiştirildi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", translatePasswordError(e.message ?? ""), [{ text: "Tamam" }]);
    } finally {
      changingRef.current = false;
      setChanging(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.hint}>
          Şifreni değiştirmek için önce mevcut şifreni doğrulaman gerekiyor.
        </Text>

        <Field label="Mevcut Şifre">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="Mevcut şifren"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Yeni Şifre">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="En az 6 karakter"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Yeni Şifre (Tekrar)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={newPassword2}
            onChangeText={setNewPassword2}
            secureTextEntry
            placeholderTextColor={colors.muted}
          />
        </Field>

        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={changing}>
          {changing ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Şifreyi Değiştir</Text>}
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
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
