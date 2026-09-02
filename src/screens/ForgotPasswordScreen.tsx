import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { requestPasswordReset, requestPasswordResetNotice } from "../lib/api/passwordReset";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  // Gerçek e-posta ile telefon/kullanıcı adı akışının başarı ekranındaki
  // metni farklı — hangisinin gösterileceğini burada tutuyoruz.
  const [sentViaEmail, setSentViaEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("Eksik bilgi", "Telefon, kullanıcı adı ya da e-postanı gir.", [{ text: "Tamam" }]);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const identifier = email.trim();
      if (identifier.includes("@")) {
        await requestPasswordReset(identifier);
        setSentViaEmail(true);
      } else {
        // Bu hesapların e-postası sentetik (gerçek e-posta yok) — normal
        // sıfırlama linki hiçbir yere ulaşmaz. Bunun yerine kulüp
        // adminine bildirim gönderiyoruz; hesap bulunsa da bulunmasa da
        // (numaralandırmayı önlemek için) aynı başarı mesajını gösteriyoruz.
        await requestPasswordResetNotice(identifier);
        setSentViaEmail(false);
      }
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
              {sentViaEmail
                ? `${email} adresine bir şifre sıfırlama linki gönderdik. E-postandaki linke dokununca uygulama açılacak ve yeni şifreni belirleyebileceksin.`
                : "Eğer bu bilgiyle bir hesap varsa, kulüp yöneticine bildirim gönderildi. Seninle iletişime geçip yeni bir geçici şifre iletecek."}
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Girişe Dön</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Hesabına kayıtlı e-posta, telefon numarası ya da kullanıcı adını gir.
            </Text>

            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              placeholder="E-posta, telefon veya kullanıcı adı"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSend} disabled={sending}>
              {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Sıfırlama Linki Gönder</Text>}
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
