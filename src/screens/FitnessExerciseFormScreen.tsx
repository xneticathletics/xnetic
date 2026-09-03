import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { FITNESS_CATEGORIES } from "../lib/fitnessExercises";
import { createCustomExercise, updateCustomExercise, getCustomExercise, uploadExerciseVideo } from "../lib/api/customFitnessExercises";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessExerciseForm">;

export default function FitnessExerciseFormScreen({ route, navigation }: Props) {
  const { exerciseId } = route.params ?? {};
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!exerciseId);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı hareketi iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) return;
    navigation.setOptions({ title: "Hareketi Düzenle" });
    let cancelled = false;
    getCustomExercise(exerciseId)
      .then((ex) => {
        if (cancelled || !ex) return;
        setCategory(ex.category);
        setName(ex.name);
        setDescription(ex.description ?? "");
        setVideoUrl(ex.video_url ?? "");
      })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Hareket yüklenemedi"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [exerciseId, navigation]);

  const handlePickVideo = async () => {
    if (!clubId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Video seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"] });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadExerciseVideo(result.assets[0].uri, clubId);
      setVideoUrl(url);
    } catch (e: any) {
      setError(e.message ?? "Video yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!category) return Alert.alert("Eksik bilgi", "Bir bölge seçmelisin.", [{ text: "Tamam" }]);
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Hareketin adını girmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const input = {
        category,
        name: name.trim(),
        bodyweight: false,
        description: description.trim() || null,
        video_url: videoUrl.trim() || null,
      };
      if (exerciseId) {
        await updateCustomExercise(exerciseId, input);
        Alert.alert("Güncellendi", `"${name.trim()}" hareketi güncellendi.`, [{ text: "Tamam" }]);
      } else {
        await createCustomExercise(input);
        Alert.alert("Eklendi", `"${name.trim()}" hareketi eklendi.`, [{ text: "Tamam" }]);
      }
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
        <Text style={styles.label}>Bölge *</Text>
        <View style={styles.chipGrid}>
          {FITNESS_CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, { borderColor: cat.color }, active && { backgroundColor: cat.color }]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.icon} {cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Hareketin Adı *</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Örn. Cable Crossover"
          placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Açıklama</Text>
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Hareketin nasıl yapıldığına dair kısa bir açıklama…"
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
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>{exerciseId ? "Güncelle" : "Kaydet"}</Text>}
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
