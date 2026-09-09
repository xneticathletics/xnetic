import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  createAnnouncement, uploadAnnouncementAttachment, MAX_ATTACHMENT_SIZE_BYTES, type AnnouncementTarget,
} from "../lib/api/announcements";
import type { Group } from "../lib/api/groups";
import { listGroups } from "../lib/api/groups";
import type { Branch } from "../lib/api/branches";
import { listBranches } from "../lib/api/branches";
import GroupMultiPickerModal from "../components/GroupMultiPickerModal";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { ProfileStackParamList } from "../navigation/ProfileStack";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
type Props = NativeStackScreenProps<ProfileStackParamList, "AnnouncementForm">;

const TARGET_OPTIONS: { value: AnnouncementTarget; label: string }[] = [
  { value: "club", label: "Tüm Kulüp" },
  { value: "group", label: "Belirli Gruplar" },
  { value: "parents", label: "Veliler" },
  { value: "coaches", label: "Antrenörler" },
  { value: "athletes", label: "Sporcular" },
];

export default function AnnouncementFormScreen({ navigation }: Props) {
  const { clubId, role } = useAuth();
  const { isLocked, selectedBranch } = useBranchSelect();
  // Branş koordinatörü sadece kendi branşının gruplarına duyuru
  // gönderebilir — "Tüm Kulüp"/"Veliler"/"Antrenörler"/"Sporcular" kulüp
  // geneli bir yayın olduğu için admin'e özel kalıyor.
  const isCoordinator = role === "coach" && isLocked;
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentMimeType, setAttachmentMimeType] = useState<string | null>(null);
  const [targetTypes, setTargetTypes] = useState<AnnouncementTarget[]>([]);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı duyuruyu iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listBranches(), listGroups()])
      .then(([b, g]) => {
        setBranches(b);
        setAllGroups(g);
      })
      .catch(() => {});
  }, []);

  // Koordinatörün tek seçeneği "Belirli Gruplar" — elle seçmesine gerek
  // kalmadan otomatik işaretliyoruz, diğer hedef tipleri hiç gösterilmiyor.
  useEffect(() => {
    if (isCoordinator) setTargetTypes(["group"]);
  }, [isCoordinator]);

  const toggleTarget = (value: AnnouncementTarget) => {
    setTargetTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  };

  const removeGroup = (id: string) => setSelectedGroups((prev) => prev.filter((g) => g.id !== id));

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

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert("Eksik bilgi", "Başlık ve içerik zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    if (targetTypes.length === 0) {
      Alert.alert("Eksik bilgi", "En az bir hedef kitle seçmelisin.", [{ text: "Tamam" }]);
      return;
    }
    if (targetTypes.includes("group") && selectedGroups.length === 0) {
      Alert.alert("Eksik bilgi", "En az bir grup seçmelisin.", [{ text: "Tamam" }]);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      let attachmentUrl: string | null = null;
      let storagePath: string | null = null;
      if (attachmentUri && attachmentName && clubId) {
        const uploaded = await uploadAnnouncementAttachment(attachmentUri, clubId, attachmentName, attachmentMimeType);
        attachmentUrl = uploaded.url;
        storagePath = uploaded.path;
      }
      await createAnnouncement({
        title,
        body,
        target_types: targetTypes,
        target_ids: targetTypes.includes("group") ? selectedGroups.map((g) => g.id) : null,
        attachment_url: attachmentUrl,
        storage_path: storagePath,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Yayınlanamadı");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
      <Field label="Başlık *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Örn. Cumartesi maçı saat değişikliği"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="İçerik *">
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, { height: 110, textAlignVertical: "top" }]}
          value={body}
          onChangeText={setBody}
          multiline
          placeholderTextColor={colors.muted}
        />
      </Field>

      {isCoordinator ? (
        <Text style={styles.coordinatorNote}>
          Bu duyuru, aşağıda seçtiğin {selectedBranch} branşındaki gruplara gönderilecek.
        </Text>
      ) : (
        <Field label="Kime Gönderilsin? * (birden fazla seçebilirsin)">
          <View style={styles.targetGrid}>
            {TARGET_OPTIONS.map((opt) => {
              const active = targetTypes.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.targetChip, active && styles.targetChipActive]}
                  onPress={() => toggleTarget(opt.value)}
                >
                  <Text style={[styles.targetChipText, active && styles.targetChipTextActive]}>
                    {active ? "✓ " : ""}{opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>
      )}

      <Field label={`Ek (isteğe bağlı, en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB)`}>
        {attachmentName ? (
          <View style={styles.selectedGroupRow}>
            <Text style={styles.selectedGroupText} numberOfLines={1}>📎 {attachmentName}</Text>
            <TouchableOpacity onPress={handleRemoveAttachment}>
              <Text style={styles.removeGroupText}>Kaldır</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addGroupButton} onPress={handlePickAttachment}>
            <Text style={styles.addGroupButtonText}>+ Fotoğraf, Video ya da Belge Ekle</Text>
          </TouchableOpacity>
        )}
      </Field>

      {targetTypes.includes("group") && (
        <Field label="Gruplar *">
          {!isCoordinator && branches.length > 1 && (
            <View style={styles.branchFilterRow}>
              <TouchableOpacity
                style={[styles.branchChip, !branchFilter && styles.branchChipActive]}
                onPress={() => setBranchFilter(null)}
              >
                <Text style={[styles.branchChipText, !branchFilter && styles.branchChipTextActive]}>Tüm Branşlar</Text>
              </TouchableOpacity>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.branchChip, branchFilter === b.name && styles.branchChipActive]}
                  onPress={() => setBranchFilter(b.name)}
                >
                  <Text style={[styles.branchChipText, branchFilter === b.name && styles.branchChipTextActive]}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedGroups.map((g) => (
            <View key={g.id} style={styles.selectedGroupRow}>
              <Text style={styles.selectedGroupText}>{g.name}</Text>
              <TouchableOpacity onPress={() => removeGroup(g.id)}>
                <Text style={styles.removeGroupText}>Kaldır</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addGroupButton} onPress={() => setGroupPickerVisible(true)}>
            <Text style={styles.addGroupButtonText}>
              {selectedGroups.length > 0 ? "Grupları Düzenle" : "+ Grup Seç (Çoklu)"}
            </Text>
          </TouchableOpacity>
        </Field>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Yayınla</Text>}
      </TouchableOpacity>

      <GroupMultiPickerModal
        visible={groupPickerVisible}
        selectedIds={selectedGroups.map((g) => g.id)}
        onConfirm={setSelectedGroups}
        onClose={() => setGroupPickerVisible(false)}
        allowedIds={
          isCoordinator
            ? allGroups.filter((g) => g.branch === selectedBranch).map((g) => g.id)
            : branchFilter
            ? allGroups.filter((g) => g.branch === branchFilter).map((g) => g.id)
            : undefined
        }
      />
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
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  coordinatorNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  targetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  targetChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  targetChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  targetChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  targetChipTextActive: { color: colors.bg },
  branchFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.sm },
  branchChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  branchChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  branchChipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  branchChipTextActive: { color: colors.bg },
  selectedGroupRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.sm,
  },
  selectedGroupText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  removeGroupText: { color: colors.coral, fontSize: 12, fontWeight: "600" },
  addGroupButton: {
    borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm,
    paddingVertical: 10, alignItems: "center",
  },
  addGroupButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
