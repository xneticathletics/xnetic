import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Alert } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { inviteUser, type InviteRole } from "../lib/api/inviteUser";
import { sanitizeUsernameInput } from "../lib/loginIdentifier";
import type { LinkedUser } from "../lib/api/athletes";

// Sporcu ve Veli giriş hesabı bağlama bölümleri için ortak bileşen.
// Bu bileşen `athletes` tablosuna HİÇBİR ŞEY YAZMAZ — sadece bir kullanıcı
// hesabı seçer ya da oluşturur, seçimi onLinkExisting/onCreated ile
// yukarı bildirir. Asıl athlete_user_id/parent_user_id yazımı, ekranın
// (AthleteFormScreen) Kaydet akışının sorumluluğunda.
export default function LinkedAccountField({
  title,
  hint,
  inviteRole,
  defaultName,
  linkedUser,
  onUnlink,
  onLinkExisting,
  onCreated,
  listExisting,
  pickerTitle,
  pickerEmptyText,
}: {
  title: string;
  hint: string;
  inviteRole: InviteRole;
  // Yeni hesap oluşturulunca "ad soyad" olarak kullanılır — kullanıcı adı
  // (giriş bilgisi) ile adı soyadı KARIŞTIRILMASIN diye, formda zaten
  // girilmiş Ad Soyad/Veli Adı Soyadı buradan aynen kullanılıyor, ayrıca
  // sorulmuyor.
  defaultName: string;
  linkedUser: LinkedUser | null;
  onUnlink: () => void;
  onLinkExisting: (user: LinkedUser) => void;
  onCreated: (user: LinkedUser) => void;
  listExisting: () => Promise<LinkedUser[]>;
  pickerTitle: string;
  pickerEmptyText: string;
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [existingUsers, setExistingUsers] = useState<LinkedUser[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const [newIdentifier, setNewIdentifier] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ identifier: string; tempPassword: string } | null>(null);

  const openPicker = () => {
    setPickerVisible(true);
    setLoadingExisting(true);
    setPickerError(null);
    listExisting()
      .then(setExistingUsers)
      .catch((e: any) => setPickerError(e.message))
      .finally(() => setLoadingExisting(false));
  };

  const handleCreate = async () => {
    if (!defaultName.trim()) {
      Alert.alert("Eksik bilgi", "Önce yukarıdaki ad soyad alanını doldurmalısın.", [{ text: "Tamam" }]);
      return;
    }
    if (!newIdentifier.trim()) {
      Alert.alert("Eksik bilgi", "Telefon numarası veya kullanıcı adı gir.", [{ text: "Tamam" }]);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await inviteUser({ identifier: newIdentifier.trim(), role: inviteRole, name: defaultName.trim() });
      setCreatedResult({ identifier: res.identifier, tempPassword: res.tempPassword });
      setNewIdentifier("");
      onCreated({ id: res.id, name: defaultName.trim(), email: null });
    } catch (e: any) {
      setCreateError(e.message ?? "Hesap oluşturulamadı");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={styles.sectionDivider}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <Text style={styles.sectionHint}>{hint}</Text>
      </View>

      {linkedUser ? (
        <View style={styles.linkedRow}>
          <Text style={styles.linkedName}>{linkedUser.name}</Text>
          <TouchableOpacity
            onPress={() => {
              setCreatedResult(null);
              onUnlink();
            }}
          >
            <Text style={styles.unlinkText}>Kaldır</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.pickRow} onPress={openPicker}>
            <Text style={styles.pickRowText}>Mevcut bir hesap seç</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>veya yeni hesap oluştur</Text>

          <Text style={styles.defaultNameLine}>
            Hesap adı: <Text style={styles.defaultNameValue}>{defaultName.trim() || "— önce yukarıdaki alanı doldur"}</Text>
          </Text>

          <View style={styles.createRow}>
            <TextInput
              style={styles.createInput}
              value={newIdentifier}
              onChangeText={(v) => setNewIdentifier(sanitizeUsernameInput(v))}
              placeholder="Telefon ya da kullanıcı adı (küçük harf, boşluksuz)"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={creating}>
              {creating ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.createButtonText}>Oluştur</Text>}
            </TouchableOpacity>
          </View>
          {createError && <Text style={styles.error}>{createError}</Text>}
        </>
      )}

      {createdResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>✓ Hesap Oluşturuldu</Text>
          <Text style={styles.resultLine}>Giriş Bilgisi: {createdResult.identifier}</Text>
          <Text selectable style={styles.passwordText}>{createdResult.tempPassword}</Text>
          <Text style={styles.resultHint}>
            Bu şifreyi ilet — bir daha görüntülenmeyecek. İlk girişte değiştirmesi zorunlu.
          </Text>
        </View>
      )}

      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>{pickerTitle}</Text>

            {loadingExisting && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
            {pickerError && <Text style={styles.error}>{pickerError}</Text>}

            <FlatList
              data={existingUsers}
              keyExtractor={(u) => u.id}
              ListEmptyComponent={!loadingExisting ? <Text style={styles.empty}>{pickerEmptyText}</Text> : null}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onLinkExisting(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.rowText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.closeButton} onPress={() => setPickerVisible(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionDivider: { marginTop: spacing.sm, marginBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  sectionLabel: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  sectionHint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  linkedRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md,
  },
  linkedName: { color: colors.teal, fontSize: 14, fontWeight: "700" },
  unlinkText: { color: colors.coral, fontSize: 13, fontWeight: "600" },
  pickRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md,
  },
  pickRowText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  chevron: { color: colors.yellow, fontSize: 20, fontWeight: "700" },
  orText: { color: colors.muted, fontSize: 11, textAlign: "center", marginVertical: spacing.sm },
  defaultNameLine: { color: colors.muted, fontSize: 12, marginBottom: spacing.xs },
  defaultNameValue: { color: colors.ink, fontWeight: "700" },
  createRow: { flexDirection: "row", gap: spacing.sm },
  createInput: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  createButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.md, justifyContent: "center" },
  createButtonText: { color: colors.bg, fontWeight: "700" },
  error: { color: colors.coral, fontSize: 12, marginTop: spacing.xs },
  resultBox: {
    backgroundColor: colors.tealSoft, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  resultTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: spacing.xs },
  resultLine: { color: colors.ink, fontSize: 13, marginBottom: spacing.sm },
  passwordText: {
    color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: 2, textAlign: "center",
    backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10,
    marginBottom: spacing.xs,
  },
  resultHint: { color: colors.muted, fontSize: 11 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "75%",
  },
  modalTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginVertical: spacing.lg, lineHeight: 18 },
  row: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm,
  },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  closeButton: { alignItems: "center", paddingVertical: spacing.sm },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
