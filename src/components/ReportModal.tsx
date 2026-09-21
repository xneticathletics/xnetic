import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { REPORT_REASONS, reportContent, blockUser, type ReportContentType, type ReportReason } from "../lib/api/moderation";

type Props = {
  visible: boolean;
  onClose: () => void;
  // Şikayet edilen kişi ve içerik (mesaj/paylaşım); type "user" ise içerik yok.
  target: { type: ReportContentType; contentId?: string | null; userId: string; userName: string; snapshot?: string } | null;
  // Şikayetle birlikte kişi engellendiyse (ör. içeriğini gizlemek için) çağrılır.
  onBlocked?: () => void;
};

export default function ReportModal({ visible, onClose, target, onBlocked }: Props) {
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setReason("inappropriate");
    setDetails("");
    setAlsoBlock(false);
    onClose();
  };

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await reportContent({
        type: target.type,
        contentId: target.contentId,
        reportedUserId: target.userId,
        reason,
        details,
        snapshot: target.snapshot,
      });
      if (alsoBlock) {
        await blockUser(target.userId);
        onBlocked?.();
      }
      Alert.alert("Teşekkürler", "Şikayetin kulüp yönetimine iletildi.");
      close();
    } catch (e: any) {
      Alert.alert("Gönderilemedi", e?.message ?? "Şikayet gönderilemedi, tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Şikayet Et</Text>
          {!!target && <Text style={styles.sub}>{target.userName} hakkında</Text>}
          {REPORT_REASONS.map((r) => (
            <TouchableOpacity key={r.key} style={styles.option} onPress={() => setReason(r.key)}>
              <View style={[styles.radio, reason === r.key && styles.radioOn]} />
              <Text style={styles.optionText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.input}
            value={details}
            onChangeText={setDetails}
            placeholder="Ek açıklama (isteğe bağlı)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.option} onPress={() => setAlsoBlock((v) => !v)}>
            <View style={[styles.check, alsoBlock && styles.radioOn]} />
            <Text style={styles.optionText}>Bu kişiyi de engelle</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={close} disabled={busy}>
              <Text style={styles.btnGhostText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.btnPrimaryText}>Gönder</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  title: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  sub: { color: colors.muted, marginBottom: spacing.sm, marginTop: 2 },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, gap: spacing.sm },
  optionText: { color: colors.ink, fontSize: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.muted },
  check: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: colors.muted },
  radioOn: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  input: {
    color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.md, minHeight: 64, marginVertical: spacing.sm, textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: "center" },
  btnGhost: { borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.ink, fontWeight: "700" },
  btnPrimary: { backgroundColor: colors.yellow },
  btnPrimaryText: { color: colors.bg, fontWeight: "800" },
});
