import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createBadgeTemplate, uploadBadgeIcon, METRIC_LABELS, type StageInput } from "../lib/api/badgeTemplates";
import type { ProfileStackParamList } from "../navigation/ProfileStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";

type Props = NativeStackScreenProps<ProfileStackParamList, "BadgeTemplateForm">;

const METRIC_OPTIONS = Object.keys(METRIC_LABELS);

// Değişken sayıda aşama — kullanıcı isteği: "kaç aşamada neler olacağını"
// admin kendisi belirlesin. En az 1 satırla başlar, + ile çoğaltılır.
type StageRow = { key: string; threshold: string; title: string; description: string };
let stageKeySeq = 0;
function newStageRow(): StageRow {
  stageKeySeq += 1;
  return { key: `s${stageKeySeq}`, threshold: "", title: "", description: "" };
}

export default function BadgeTemplateFormScreen({ navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [metricType, setMetricType] = useState(METRIC_OPTIONS[0]);
  const [iconUri, setIconUri] = useState<string | null>(null); // yerel önizleme
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [stages, setStages] = useState<StageRow[]>([newStageRow()]);
  const [saving, setSaving] = useState(false);

  const hasUnsavedChanges =
    !!name.trim() || !!description.trim() || !!shortDescription.trim() || !!iconUri ||
    stages.some((s) => s.threshold.trim() || s.title.trim() || s.description.trim());
  const { markSaved } = useUnsavedChangesGuard(navigation, hasUnsavedChanges);

  const handlePickIcon = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    // allowsEditing BİLEREK kullanılmıyor (bkz. cropToSquare.ts'teki gerekçe
    // — bazı fotoğraflarda iOS'un kırpma ekranı sessizce başarısız oluyor).
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    setUploadingIcon(true);
    try {
      const url = await uploadBadgeIcon(asset.uri, asset.width, asset.height);
      setIconUri(url);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Simge yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setUploadingIcon(false);
    }
  };

  const updateStage = (key: string, patch: Partial<StageRow>) => {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };
  const addStage = () => setStages((prev) => [...prev, newStageRow()]);
  const removeStage = (key: string) => setStages((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Rozet adı zorunludur.", [{ text: "Tamam" }]);

    const parsedStages: StageInput[] = [];
    for (const s of stages) {
      const threshold = Number(s.threshold);
      if (!s.threshold.trim() || isNaN(threshold) || threshold <= 0) {
        return Alert.alert("Eksik bilgi", "Her aşama için geçerli bir eşik (0'dan büyük) girmelisin.", [{ text: "Tamam" }]);
      }
      parsedStages.push({ threshold, title: s.title.trim() || null, description: s.description.trim() || null });
    }
    // Eşiğe göre artan sırada saklanıyor — admin hangi sırada girerse girsin.
    parsedStages.sort((a, b) => a.threshold - b.threshold);

    setSaving(true);
    try {
      await createBadgeTemplate(
        {
          name: name.trim(),
          icon_url: iconUri,
          description: description.trim(),
          short_description: shortDescription.trim(),
          metric_type: metricType,
        },
        parsedStages
      );
      markSaved();
      Alert.alert("Oluşturuldu", "Rozet şablonu oluşturuldu — uygun kişiler eşiğe ulaştıkça otomatik kazanacak.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Simge</Text>
        <TouchableOpacity style={styles.iconPicker} onPress={handlePickIcon} disabled={uploadingIcon}>
          {uploadingIcon ? (
            <ActivityIndicator color={colors.yellow} />
          ) : iconUri ? (
            <Image source={{ uri: iconUri }} style={styles.iconPreview} />
          ) : (
            <Text style={styles.iconPickerText}>+ Simge Seç</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Rozet Adı *</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Örn. Disiplin Ustası"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Bu rozet ne için veriliyor?"
          placeholderTextColor={colors.muted}
          multiline
        />

        <Text style={styles.label}>Kısa Açıklama</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder="Listede görünecek kısa satır"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Hangi Veriye Göre Kazanılacak? *</Text>
        <View style={styles.metricGrid}>
          {METRIC_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.metricChip, metricType === m && styles.metricChipActive]}
              onPress={() => setMetricType(m)}
            >
              <Text style={[styles.metricChipText, metricType === m && styles.metricChipTextActive]}>{METRIC_LABELS[m]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.stagesHeader}>
          <Text style={styles.label}>Aşamalar *</Text>
          <TouchableOpacity onPress={addStage}>
            <Text style={styles.addStageText}>+ Aşama Ekle</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Her aşama için gereken sayıyı (eşik) gir — kaç aşama olacağı sana kalmış.</Text>

        {stages.map((s, i) => (
          <View key={s.key} style={styles.stageCard}>
            <View style={styles.stageCardHeader}>
              <Text style={styles.stageCardTitle}>Aşama {i + 1}</Text>
              {stages.length > 1 && (
                <TouchableOpacity onPress={() => removeStage(s.key)}>
                  <Text style={styles.removeStageText}>Kaldır</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={s.threshold}
              onChangeText={(v) => updateStage(s.key, { threshold: v.replace(/[^0-9]/g, "") })}
              placeholder="Eşik (ör. 10)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
            <TextInput
              onFocus={handleFocus}
              style={[styles.input, { marginTop: spacing.sm }]}
              value={s.title}
              onChangeText={(v) => updateStage(s.key, { title: v })}
              placeholder="Bu aşamanın başlığı (opsiyonel)"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              onFocus={handleFocus}
              style={[styles.input, { marginTop: spacing.sm }]}
              value={s.description}
              onChangeText={(v) => updateStage(s.key, { description: v })}
              placeholder="Bu aşamada ne olacağı (opsiyonel)"
              placeholderTextColor={colors.muted}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Rozeti Oluştur</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: spacing.md },
  hint: { color: colors.muted, fontSize: 11, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  iconPicker: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    alignItems: "center", justifyContent: "center", alignSelf: "flex-start", overflow: "hidden",
  },
  iconPreview: { width: 88, height: 88 },
  iconPickerText: { color: colors.muted, fontSize: 11, fontWeight: "600", textAlign: "center", paddingHorizontal: 6 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  metricChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  metricChipActive: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  metricChipText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  metricChipTextActive: { color: colors.yellow, fontWeight: "700" },
  stagesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md },
  addStageText: { color: colors.teal, fontWeight: "700", fontSize: 13 },
  stageCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  stageCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  stageCardTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  removeStageText: { color: colors.coral, fontSize: 12, fontWeight: "700" },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
