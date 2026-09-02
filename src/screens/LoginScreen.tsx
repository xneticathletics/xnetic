import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/tokens";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

export default function LoginScreen({
  onForgotPassword, onCreateClub,
}: { onForgotPassword: () => void; onCreateClub: () => void }) {
  const { signIn } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../assets/xnetic-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>X-NETIC</Text>
        <Text style={styles.subtitle}>Spor Kulübü Yönetim Sistemleri</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputWithButton]}
            placeholder="E-posta, telefon veya kullanıcı adı"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {!!email && (
            <TouchableOpacity style={styles.singleButtonSlot} onPress={() => setEmail("")}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputWithTwoButtons]}
            placeholder="Şifre"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.passwordButtonsRow}>
            {!!password && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setPassword("")}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
            {!!password && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.eyeButtonText}>{showPassword ? "🙈" : "👁"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onForgotPassword}>
          <Text style={styles.secondaryButtonText}>Şifremi Unuttum</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onCreateClub}>
          <Text style={[styles.secondaryButtonText, styles.createClubButtonText]}>Kulüp Oluştur</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1, justifyContent: "flex-start", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingTop: 72,
  },
  logo: { width: 180, height: 180, marginBottom: spacing.lg, borderRadius: radius.md },
  title: { color: colors.ink, fontSize: 28, fontWeight: "700", marginBottom: spacing.xs, textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: spacing.xl, textAlign: "center" },
  inputWrapper: { width: "100%", justifyContent: "center", marginBottom: spacing.md },
  input: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputWithButton: { paddingRight: 44 },
  inputWithTwoButtons: { paddingRight: 80 },
  passwordButtonsRow: {
    position: "absolute", right: spacing.xs, flexDirection: "row", alignItems: "center",
  },
  singleButtonSlot: { position: "absolute", right: spacing.xs, padding: spacing.sm },
  clearButton: { padding: spacing.sm },
  clearButtonText: { color: colors.muted, fontSize: 15, fontWeight: "700" },
  eyeButtonText: { fontSize: 16 },
  error: { color: colors.coral, marginBottom: spacing.md, fontSize: 13 },
  button: {
    width: "100%",
    backgroundColor: colors.yellow,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  secondaryButtonText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  createClubButtonText: { color: colors.yellow },
});
