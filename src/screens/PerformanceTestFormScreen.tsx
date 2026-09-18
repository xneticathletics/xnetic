import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { PERFORMANCE_CATEGORIES } from "../lib/performanceTests";
import { createCustomTest, updateCustomTest, getCustomTest, uploadTestVideo, isLowerBetterUnit } from "../lib/api/customPerformanceTests";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";

type Props = NativeStackScreenProps<HomeStackParamList, "PerformanceTestForm">;

export default function PerformanceTestFormScreen({ route, navigation }: Props) {
  const { testId } = route.params ?? {};
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [equipment, setEquipment] = useState("");
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  // İyi yön: true = düşük değer iyi (süre, düşme sayısı...), false = yüksek
  // değer iyi. Kullanıcı elle seçmediyse birimden (sn/dk → düşük) tahmin
  // edilir; ölçüm ekranındaki artış/azalış renginin doğru olması için.
  const [lowerIsBetter, setLowerIsBetter] = useState(false);
  const directionTouchedRef = useRef(false);
  const initialSnapshotRef = useRef(
    JSON.stringify({ category: null, name: "", unit: "", equipment: "", instructions: "", videoUrl: "", lowerIsBetter: false })
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!testId);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı testi iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    navigation.setOptions({ title: "Testi Düzenle" });
    let cancelled = false;
    getCustomTest(testId)
      .then((t) => {
        if (cancelled || !t) return;
        const loadedEquipment = t.equipment ?? "";
        const loadedVideoUrl = t.video_url ?? "";
        setCategory(t.category);
        setName(t.name);
        setUnit(t.unit);
        setEquipment(loadedEquipment);
        setInstructions(t.instructions);
        setVideoUrl(loadedVideoUrl);
        const loadedLower = t.lower_is_better ?? isLowerBetterUnit(t.unit);
        directionTouchedRef.current = t.lower_is_better !== null;
        setLowerIsBetter(loadedLower);
        initialSnapshotRef.current = JSON.stringify({
          category: t.category, name: t.name, unit: t.unit,
          equipment: loadedEquipment, instructions: t.instructions, videoUrl: loadedVideoUrl,
          lowerIsBetter: loadedLower,
        });
      })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Test yüklenemedi"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [testId, navigation]);

  const hasUnsavedChanges =
    !loading &&
    JSON.stringify({ category, name, unit, equipment, instructions, videoUrl, lowerIsBetter }) !== initialSnapshotRef.current;

  const handleUnitChange = (text: string) => {
    setUnit(text);
    if (!directionTouchedRef.current) setLowerIsBetter(isLowerBetterUnit(text));
  };
  const chooseDirection = (lower: boolean) => {
    directionTouchedRef.current = true;
    setLowerIsBetter(lower);
  };
  const { markSaved } = useUnsavedChangesGuard(navigation, hasUnsavedChanges);

  const handlePickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Video seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    // iOS seçim anında videoyu 720p H.264'e sıkıştırıyor — bkz.
    // FitnessExerciseFormScreen'deki aynı gerekçe.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadTestVideo(result.assets[0].uri, clubId);
      setVideoUrl(url);
    } catch (e: any) {
      setError(e.message ?? "Video yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!category) return Alert.alert("Eksik bilgi", "Bir kategori seçmelisin.", [{ text: "Tamam" }]);
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Testin adını girmelisin.", [{ text: "Tamam" }]);
    if (!unit.trim()) return Alert.alert("Eksik bilgi", "Birim girmelisin (ör. sn, cm, kg).", [{ text: "Tamam" }]);
    if (!instructions.trim()) return Alert.alert("Eksik bilgi", "Nasıl yapıldığını açıklamalısın.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const input = {
        category,
        name: name.trim(),
        unit: unit.trim(),
        equipment: equipment.trim() || null,
        instructions: instructions.trim(),
        video_url: videoUrl.trim() || null,
        lower_is_better: lowerIsBetter,
      };
      if (testId) {
        await updateCustomTest(testId, input);
        Alert.alert("Güncellendi", `"${name.trim()}" testi güncellendi.`, [{ text: "Tamam" }]);
      } else {
        await createCustomTest(input);
        Alert.alert("Eklendi", `"${name.trim()}" testi eklendi.`, [{ text: "Tamam" }]);
      }
      markSaved();
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Kategori *</Text>
        <View style={styles.chipGrid}>
          {PERFORMANCE_CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, { borderColor: cat.color }, active && { backgroundColor: cat.color }]}
                onPress={() => setCategory(cat.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.icon} {cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Testin Adı *</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Örn. 20m Sürat"
          placeholderTextColor={colors.muted}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Birim *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={unit}
              onChangeText={handleUnitChange}
              placeholder="Örn. sn, cm, kg"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Ekipman (isteğe bağlı)</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={equipment}
              onChangeText={setEquipment}
              placeholder="Örn. Kronometre"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Hangi Değer Daha İyi? *</Text>
        <View style={styles.chipGrid}>
          {([
            { lower: false, label: "Yüksek değer iyi", hint: "mesafe, tekrar, kuvvet" },
            { lower: true, label: "Düşük değer iyi", hint: "süre, düşme sayısı" },
          ] as const).map((o) => {
            const active = lowerIsBetter === o.lower;
            return (
              <TouchableOpacity
                key={o.label}
                style={[styles.chip, { borderColor: colors.violet }, active && { backgroundColor: colors.violet }]}
                onPress={() => chooseDirection(o.lower)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.directionHint}>
          Ölçüm ekranındaki artış/azalış yüzdesinin yeşil (iyileşme) mi kırmızı (kötüleşme) mi görüneceğini belirler.
          Ör. sürat ve düşme sayısında düşük değer iyidir.
        </Text>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Nasıl Yapılır? *</Text>
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Testin nasıl uygulandığına dair açıklama…"
          placeholderTextColor={colors.muted}
          multiline
        />

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Video</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="Video linki yapıştır (YouTube, Vimeo, vb.)"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
        <View style={styles.videoRow}>
          <TouchableOpacity style={styles.videoPickButton} onPress={handlePickVideo} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.videoPickButtonText}>📁 Dosya Seç ve Yükle</Text>
            )}
          </TouchableOpacity>
          {!!videoUrl && (
            <TouchableOpacity onPress={() => setVideoUrl("")}>
              <Text style={styles.videoClearText}>Kaldır</Text>
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || uploading}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>{testId ? "Güncelle" : "Kaydet"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 10 },
  chipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.bg, fontWeight: "800" },
  directionHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  rowItem: { flex: 1 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  videoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  videoPickButton: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  videoPickButtonText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  videoClearText: { color: colors.coral, fontWeight: "700", fontSize: 12 },
  errorText: { color: colors.coral, marginTop: spacing.md },
  saveButton: { backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
