import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { notifyAllClubAdmins } from "../lib/api/superAdmin";
import { useHomeButton } from "../hooks/useHomeButton";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminAnnounce">;

export default function SuperAdminAnnounceScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      return Alert.alert("Eksik bilgi", "Başlık ve mesaj alanlarını doldurmalısın.", [{ text: "Tamam" }]);
    }
    setSending(true);
    setError(null);
    try {
      const count = await notifyAllClubAdmins(title.trim(), body.trim());
      setTitle("");
      setBody("");
      Alert.alert("Gönderildi", `Duyuru ${count} kulüp adminine gönderildi.`, [{ text: "Tamam" }]);
    } catch (e: any) {
      setError(e.message ?? "Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.infoBox}>
          Bu duyuru SADECE kulüp adminlerine gönderilir — hiçbir kulübün veli/sporcu/antrenör
          verisine erişim gerekmez, gizlilik ve güvenlik gereği kapsam bilerek bu şekilde sınırlı tutuldu.
        </Text>

        <Text style={styles.label}>Başlık *</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Örn. Yeni özellik: Fitness Modülü"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Mesaj *</Text>
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={body}
          onChangeText={setBody}
          placeholder="Duyuru metni..."
          placeholderTextColor={colors.muted}
          multiline
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Kulüp Adminlerine Gönder</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
  errorText: { color: colors.coral, marginTop: spacing.md, textAlign: "center" },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
