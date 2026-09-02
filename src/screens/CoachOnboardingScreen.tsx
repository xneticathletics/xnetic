import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { completeMyOnboarding, uploadMyPhoto, getCurrentAppUserId } from "../lib/api/currentUser";
import { listBranches, type Branch } from "../lib/api/branches";
import { setCoachBranches } from "../lib/api/coaches";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { formatPhoneNumber } from "../lib/phoneFormat";
import BirthDateInput from "../components/BirthDateInput";

const EDUCATION_OPTIONS: { value: string; label: string }[] = [
  { value: "lise", label: "Lise" },
  { value: "universite", label: "Üniversite" },
  { value: "yuksek_lisans", label: "Yüksek Lisans" },
  { value: "doktora", label: "Doktora" },
];

type BranchSelection = { branch: Branch; level: number };

// Yeni davet edilen bir antrenörün ilk girişte doldurması gereken ekran
// — tamamlamadan Ana Sayfa'ya geçemez (geri/ana sayfa butonu yok).
// onComplete() çağrıldığında RootNavigator normal uygulamaya geçirir.
export default function CoachOnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { signOut } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSelections, setBranchSelections] = useState<BranchSelection[]>([]);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSubmit iki kez çalışabiliyordu. Senkron
  // bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBranches().then(setBranches).catch(() => {});
  }, []);

  const toggleBranch = (branch: Branch) => {
    setBranchSelections((prev) => {
      const exists = prev.find((s) => s.branch.id === branch.id);
      if (exists) return prev.filter((s) => s.branch.id !== branch.id);
      return [...prev, { branch, level: 1 }];
    });
  };

  const setBranchLevel = (branchId: string, level: number) => {
    setBranchSelections((prev) => prev.map((s) => (s.branch.id === branchId ? { ...s, level } : s)));
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Ad soyad zorunludur.", [{ text: "Tamam" }]);
    if (!phone.trim()) return Alert.alert("Eksik bilgi", "Telefon numarası zorunludur.", [{ text: "Tamam" }]);
    if (!birthDate.trim()) return Alert.alert("Eksik bilgi", "Doğum tarihi zorunludur.", [{ text: "Tamam" }]);
    if (!educationLevel) return Alert.alert("Eksik bilgi", "Öğrenim durumu zorunludur.", [{ text: "Tamam" }]);
    if (!photoUri) return Alert.alert("Eksik bilgi", "Profil fotoğrafı zorunludur.", [{ text: "Tamam" }]);
    if (branchSelections.length === 0) return Alert.alert("Eksik bilgi", "En az bir branş seçmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await completeMyOnboarding({
        name: name.trim(),
        phone: phone.trim(),
        birthDate,
        educationLevel,
      });
      await uploadMyPhoto(photoUri);

      const userId = await getCurrentAppUserId();
      if (userId) {
        await setCoachBranches(userId, branchSelections.map((s) => ({ branch_id: s.branch.id, level: s.level })));
      }

      onComplete();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Hoş Geldin! 👋</Text>
        <Text style={styles.subtitle}>
          Uygulamayı kullanmaya başlamadan önce kendi bilgilerini tamamlaman gerekiyor.
        </Text>

        <Field label="Profil Fotoğrafı *">
          <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoPlaceholderText}>+ Fotoğraf Seç</Text>
            )}
          </TouchableOpacity>
        </Field>

        <Field label="Ad Soyad *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ad Soyad"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Telefon *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={phone}
            onChangeText={(v) => setPhone(formatPhoneNumber(v))}
            keyboardType="phone-pad"
            placeholder="0532-123-45-67"
            placeholderTextColor={colors.muted}
            maxLength={14}
          />
        </Field>

        <Field label="Doğum Tarihi *">
          <BirthDateInput value={birthDate || null} onChange={(iso) => setBirthDate(iso ?? "")} onFocus={handleFocus} />
        </Field>

        <Field label="Öğrenim Durumu *">
          <View style={styles.chipGrid}>
            {EDUCATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, educationLevel === opt.value && styles.chipActive]}
                onPress={() => setEducationLevel(opt.value)}
              >
                <Text style={[styles.chipText, educationLevel === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Branş(lar) * — birden fazla seçebilirsin">
          <View style={styles.chipGrid}>
            {branches.map((b) => {
              const active = branchSelections.some((s) => s.branch.id === b.id);
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleBranch(b)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{active ? "✓ " : ""}{b.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        {branchSelections.map((sel) => (
          <View key={sel.branch.id} style={styles.branchLevelBox}>
            <Text style={styles.branchLevelTitle}>{sel.branch.name} — Kademe</Text>
            <View style={styles.chipGrid}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.levelChip, sel.level === level && styles.chipActive]}
                  onPress={() => setBranchLevel(sel.branch.id, level)}
                >
                  <Text style={[styles.chipText, sel.level === level && styles.chipTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet ve Devam Et</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut} disabled={saving}>
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>
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
  title: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: spacing.lg, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8 },
  levelChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.bg },
  photoPicker: {
    width: 96, height: 96, borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  photoPreview: { width: 96, height: 96 },
  photoPlaceholderText: { color: colors.muted, fontSize: 11, textAlign: "center", paddingHorizontal: 8 },
  branchLevelBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  branchLevelTitle: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: spacing.sm },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  signOutButton: { alignItems: "center", paddingVertical: spacing.md, marginBottom: spacing.xl },
  signOutText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
});
