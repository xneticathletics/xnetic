import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { colors, radius, spacing } from "../theme/tokens";
import { supabase } from "../lib/supabase";
import { getCurrentLoginIdentifier, updateLoginIdentifier } from "../lib/api/accountIdentity";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { translatePasswordError } from "../lib/passwordErrors";

export default function ChangePasswordScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const headerHeight = useHeaderHeight();

  // Giriş bilgisi (telefon/kullanıcı adı/e-posta) — Kişisel Bilgiler'deki
  // "Telefon" alanından AYRI: o sadece iletişim amaçlı, bu ise gerçekten
  // uygulamaya girerken kullanılan kimlik. Bkz. accountIdentity.ts.
  const [currentIdentifier, setCurrentIdentifier] = useState<string | null>(null);
  const [newIdentifier, setNewIdentifier] = useState("");
  const [savingIdentifier, setSavingIdentifier] = useState(false);
  const savingIdentifierRef = useRef(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [changing, setChanging] = useState(false);
  // TouchableOpacity'nin disabled={changing} kontrolü, setChanging(true)
  // state güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu
  // engelleyemiyor — hızlı çift dokunuşta handleChangePassword iki kez
  // çalışabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const changingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getCurrentLoginIdentifier()
        .then((id) => { if (!cancelled) setCurrentIdentifier(id); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [])
  );

  const handleUpdateIdentifier = async () => {
    if (savingIdentifierRef.current) return;
    if (!newIdentifier.trim()) {
      Alert.alert("Eksik bilgi", "Yeni telefon, kullanıcı adı ya da e-posta gir.", [{ text: "Tamam" }]);
      return;
    }
    savingIdentifierRef.current = true;
    setSavingIdentifier(true);
    try {
      await updateLoginIdentifier(newIdentifier.trim());
      const loginId = await getCurrentLoginIdentifier();
      setCurrentIdentifier(loginId);
      setNewIdentifier("");
      Alert.alert("Kaydedildi", "Artık bu bilgiyle giriş yapabilirsin.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Güncellenemedi", [{ text: "Tamam" }]);
    } finally {
      savingIdentifierRef.current = false;
      setSavingIdentifier(false);
    }
  };

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <SectionHeader title="Giriş Bilgisi" />
        <Text style={styles.hint}>
          Uygulamaya girerken kullandığın telefon, kullanıcı adı ya da e-postayı buradan değiştirebilirsin.
        </Text>

        <View style={styles.currentIdentifierBox}>
          <Text style={styles.currentIdentifierLabel}>Şu an bununla giriş yapıyorsun</Text>
          <Text style={styles.currentIdentifierValue}>{currentIdentifier ?? "—"}</Text>
        </View>

        <Field label="Yeni Telefon, Kullanıcı Adı ya da E-posta">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={newIdentifier}
            onChangeText={setNewIdentifier}
            autoCapitalize="none"
            placeholder="05XX XXX XX XX, kullaniciadi ya da e-posta"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <TouchableOpacity style={styles.identifierButton} onPress={handleUpdateIdentifier} disabled={savingIdentifier}>
          {savingIdentifier ? (
            <ActivityIndicator color={colors.violet} />
          ) : (
            <Text style={styles.identifierButtonText}>Giriş Bilgisini Güncelle</Text>
          )}
        </TouchableOpacity>

        <SectionHeader title="Şifre Değiştir" />
        <Text style={styles.hint}>
          Şifreni değiştirmek için önce mevcut şifreni doğrulaman gerekiyor.
        </Text>

        <PasswordField
          label="Mevcut Şifre"
          value={oldPassword}
          onChangeText={setOldPassword}
          onFocus={handleFocus}
          placeholder="Mevcut şifren"
        />

        <PasswordField
          label="Yeni Şifre"
          value={newPassword}
          onChangeText={setNewPassword}
          onFocus={handleFocus}
          placeholder="En az 6 karakter"
        />

        <PasswordField
          label="Yeni Şifre (Tekrar)"
          value={newPassword2}
          onChangeText={setNewPassword2}
          onFocus={handleFocus}
        />

        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={changing}>
          {changing ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Şifreyi Değiştir</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderBar} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
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

// Şifre alanları için: göster/gizle (👁️) ve tek dokunuşla komple temizleme
// (✕) — kullanıcı yazdığını kontrol edip yanlış girişi tek tuşla silebilsin.
function PasswordField({
  label, value, onChangeText, onFocus, placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus: (event: any) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label}>
      <View style={styles.passwordWrapper}>
        <TextInput
          onFocus={onFocus}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
        />
        {value.length > 0 && (
          <TouchableOpacity style={styles.passwordIconButton} onPress={() => onChangeText("")}>
            <Text style={styles.passwordIconText}>✕</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.passwordIconButton} onPress={() => setVisible((v) => !v)}>
          <Text style={styles.passwordIconText}>{visible ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  sectionHeaderBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  sectionHeaderText: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  passwordWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingLeft: spacing.md, paddingRight: spacing.xs,
  },
  passwordInput: { flex: 1, color: colors.ink, paddingVertical: 12 },
  passwordIconButton: { paddingHorizontal: 8, paddingVertical: 8 },
  passwordIconText: { fontSize: 16 },
  currentIdentifierBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  currentIdentifierLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  currentIdentifierValue: { color: colors.ink, fontSize: 15, fontWeight: "700", marginTop: 4 },
  identifierButton: {
    borderWidth: 1, borderColor: colors.violet, borderRadius: radius.md,
    paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  identifierButtonText: { color: colors.violet, fontWeight: "700", fontSize: 15 },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
