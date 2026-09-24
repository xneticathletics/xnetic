import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { requestPasswordResetNotice } from "../lib/api/passwordReset";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

// Tek akış: talep kulüp yöneticisine bildirim olarak gider, yönetici
// Kullanıcılar ekranından geçici şifre üretip kişiye iletir. E-posta
// linkiyle sıfırlama kaldırıldı (kullanıcı isteği) — zaten veli/sporcu/
// antrenör hesaplarının çoğunda gerçek e-posta yok, link hiçbir yere
// ulaşmıyordu.
//
// Girilen bilgi kullanıcı adı YA DA telefon olabilir; kişinin giriş
// yaparken kullandığı bilgi olmak zorunda değil (eşleştirme:
// public.request_password_reset_notice).
export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!identifier.trim()) {
      Alert.alert("Eksik bilgi", "Kullanıcı adını ya da telefon numaranı gir.", [{ text: "Tamam" }]);
      return;
    }
    setSending(true);
    setError(null);
    try {
      // Hesap bulunsa da bulunmasa da aynı mesajı gösteriyoruz — hangi
      // kullanıcı adının/numaranın kayıtlı olduğu dışarı sızmasın diye.
      await requestPasswordResetNotice(identifier.trim());
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Gönderilemedi");
    } finally {
      setSending(false);
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
        <Text style={styles.title}>Şifremi Unuttum</Text>

        {sent ? (
          <>
            <Text style={styles.successText}>
              Eğer bu bilgiyle bir hesap varsa, kulüp yöneticine şifre sıfırlama talebin iletildi.
              Yönetici yeni bir geçici şifre üretip sana iletecek.
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Girişe Dön</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Kullanıcı adını veya telefon numaranı gir. Talebin kulüp yöneticine iletilecek;
              yönetici yeni bir geçici şifre üretip sana iletecek.
            </Text>

            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              placeholder="Kullanıcı adı veya telefon numarası"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Kullanıcı adı veya telefon numarası"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSend} disabled={sending}>
              {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Sıfırlama Talebi Gönder</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>Girişe Dön</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  title: { color: colors.ink, fontSize: 24, fontWeight: "700", marginBottom: spacing.xs, textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: spacing.xl, textAlign: "center", lineHeight: 20 },
  successText: { color: colors.ink, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 14, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md, fontSize: 13 },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  backButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  backButtonText: { color: colors.teal, fontWeight: "700", fontSize: 15 },
  backLink: { alignItems: "center", paddingVertical: spacing.md },
  backLinkText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
});
