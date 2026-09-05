import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { notifyAllClubAdmins, uploadBroadcastAttachment } from "../lib/api/superAdmin";
import { MAX_ATTACHMENT_SIZE_BYTES } from "../lib/api/announcements";
import { useHomeButton } from "../hooks/useHomeButton";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminAnnounce">;

export default function SuperAdminAnnounceScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentMimeType, setAttachmentMimeType] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size != null && asset.size > MAX_ATTACHMENT_SIZE_BYTES) {
      Alert.alert("Dosya çok büyük", `Ekler en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB olabilir.`, [{ text: "Tamam" }]);
      return;
    }
    setAttachmentUri(asset.uri);
    setAttachmentName(asset.name);
    setAttachmentMimeType(asset.mimeType ?? null);
  };

  const handleRemoveAttachment = () => {
    setAttachmentUri(null);
    setAttachmentName(null);
    setAttachmentMimeType(null);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      return Alert.alert("Eksik bilgi", "Başlık ve mesaj alanlarını doldurmalısın.", [{ text: "Tamam" }]);
    }
    setSending(true);
    setError(null);
    try {
      let attachmentUrl: string | null = null;
      if (attachmentUri && attachmentName) {
        attachmentUrl = await uploadBroadcastAttachment(attachmentUri, attachmentName, attachmentMimeType);
      }
      const count = await notifyAllClubAdmins(title.trim(), body.trim(), attachmentUrl);
      setTitle("");
      setBody("");
      handleRemoveAttachment();
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

        <Text style={styles.label}>{`Ek (isteğe bağlı, en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB)`}</Text>
        {attachmentName ? (
          <View style={styles.attachmentRow}>
            <Text style={styles.attachmentText} numberOfLines={1}>📎 {attachmentName}</Text>
            <TouchableOpacity onPress={handleRemoveAttachment}>
              <Text style={styles.attachmentRemove}>Kaldır</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachmentButton} onPress={handlePickAttachment}>
            <Text style={styles.attachmentButtonText}>+ Fotoğraf, Video ya da Belge Ekle</Text>
          </TouchableOpacity>
        )}

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
  attachmentRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  attachmentText: { color: colors.ink, fontWeight: "600", fontSize: 13, flex: 1, marginRight: spacing.sm },
  attachmentRemove: { color: colors.coral, fontSize: 12, fontWeight: "600" },
  attachmentButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  attachmentButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  errorText: { color: colors.coral, marginTop: spacing.md, textAlign: "center" },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
