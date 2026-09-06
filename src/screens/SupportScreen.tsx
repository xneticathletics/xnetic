import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { colors, radius, spacing } from "../theme/tokens";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

const SUPPORT_EMAIL = "destek@xnetic.net";

// Profil > Yardım/Destek karosuna basınca artık DOĞRUDAN telefonun mail
// uygulamasına atlamıyor (kullanıcı bunu şaşırtıcı buldu) — önce bu ara
// ekrana geliyor, mesajını (isteğe bağlı) yazıp "Mail Gönder"e kendi
// basınca mail uygulaması açılıyor.
export default function SupportScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const headerHeight = useHeaderHeight();
  const [message, setMessage] = useState("");

  const handleSendMail = () => {
    const body = message.trim() ? `${encodeURIComponent(message.trim())}\n\n` : "";
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("X-NETIC Destek Talebi")}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Açılamadı", "Cihazında bir mail uygulaması bulunamadı.", [{ text: "Tamam" }]);
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.infoBox}>
          Bir sorunun mu var, bir şey mi bildirmek istiyorsun? Aşağıya yazıp
          "Mail Gönder"e bas — mail uygulaman açılacak, göndermeden önce
          istersen düzenleyebilirsin. Cevabın, gönderdiğin mail adresine gelir.
        </Text>

        <Text style={styles.label}>Mesajın (isteğe bağlı)</Text>
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={message}
          onChangeText={setMessage}
          placeholder="Yaşadığın sorunu ya da isteğini yaz..."
          placeholderTextColor={colors.muted}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSendMail}>
          <Text style={styles.buttonText}>✉️ Mail Gönder</Text>
        </TouchableOpacity>

        <Text style={styles.emailHint}>{SUPPORT_EMAIL}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  infoBox: {
    color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 140, textAlignVertical: "top", marginBottom: spacing.lg },
  button: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  emailHint: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: spacing.md },
});
