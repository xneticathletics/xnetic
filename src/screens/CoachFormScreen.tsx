import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getCoach, updateCoach, deactivateCoach, type Coach } from "../lib/api/coaches";
import { uploadPhotoForUser } from "../lib/api/currentUser";
import BirthDateInput from "../components/BirthDateInput";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import { formatPhoneNumber } from "../lib/phoneFormat";
import { cropToSquare } from "../lib/cropToSquare";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachForm">;

const EDUCATION_OPTIONS: { value: string; label: string }[] = [
  { value: "lise", label: "Lise" },
  { value: "universite", label: "Üniversite" },
  { value: "yuksek_lisans", label: "Yüksek Lisans" },
  { value: "doktora", label: "Doktora" },
];
const GENDER_OPTIONS: { value: "erkek" | "kadin"; label: string }[] = [
  { value: "erkek", label: "Erkek" },
  { value: "kadin", label: "Kadın" },
];

export default function CoachFormScreen({ route, navigation }: Props) {
  const { coachId } = route.params;
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [coach, setCoach] = useState<Coach | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [gender, setGender] = useState<"erkek" | "kadin" | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışabiliyordu. Senkron bir
  // ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const initialSnapshotRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getCoach(coachId)
        .then((c) => {
          setCoach(c);
          setName(c.name);
          setPhone(c.phone ?? "");
          setContactEmail(c.contact_email ?? "");
          setBirthDate(c.birth_date);
          setEducationLevel(c.education_level);
          setGender(c.gender);
          setAddress(c.address ?? "");
          setEmergencyName(c.emergency_contact_name ?? "");
          setEmergencyPhone(c.emergency_contact_phone ?? "");
          initialSnapshotRef.current = JSON.stringify([
            c.name, c.phone ?? "", c.birth_date, c.education_level, c.gender,
            c.address ?? "", c.emergency_contact_name ?? "", c.emergency_contact_phone ?? "", c.contact_email ?? "",
          ]);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [coachId])
  );

  const hasUnsavedChanges =
    !loading &&
    initialSnapshotRef.current !== null &&
    initialSnapshotRef.current !==
      JSON.stringify([name, phone, birthDate, educationLevel, gender, address, emergencyName, emergencyPhone, contactEmail]);
  // photoUri (henüz yüklenmemiş yeni fotoğraf) ayrıca kontrol ediliyor —
  // snapshot'a dahil değil çünkü seçilir seçilmez zaten "değişti" demektir.
  const { markSaved } = useUnsavedChangesGuard(navigation, hasUnsavedChanges || !!photoUri);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setPhotoUri(await cropToSquare(asset.uri, asset.width, asset.height));
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Ad soyad zorunludur.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await updateCoach(coachId, {
        name: name.trim(),
        contact_email: contactEmail.trim() || null,
        phone: phone.trim() || null,
        birth_date: birthDate,
        education_level: educationLevel,
        gender,
        address: address.trim() || null,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
      });
      if (photoUri) await uploadPhotoForUser(coachId, photoUri);
      markSaved();
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleRemoveCoach = () => {
    Alert.alert(
      "Antrenörü kulüpten çıkar",
      `${coach?.name ?? "Bu antrenör"} kulüpten çıkarılacak ve tüm grup atamaları kaldırılacak. Hesabı tamamen silmiyoruz — istersen ileride tekrar aktifleştirebilirsin. Devam etmek istiyor musun?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kulüpten Çıkar",
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              markSaved();
              await deactivateCoach(coachId);
              navigation.navigate("CoachesList");
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "İşlem başarısız", [{ text: "Tamam" }]);
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Field label="Profil Fotoğrafı">
          <TouchableOpacity
            style={styles.photoPicker}
            onPress={pickPhoto}
            accessibilityLabel={photoUri || coach?.photo_url ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
          >
            {photoUri || coach?.photo_url ? (
              <Image source={{ uri: photoUri ?? coach!.photo_url! }} style={styles.photoPreview} />
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

        {/* coach.email GİRİŞ kimliği (tel.../usr...@xnetic.local olabilir),
            kullanıcıya hiç gösterilmemeli — burada gösterilen ve düzenlenen
            contact_email, kişinin GERÇEK e-postası (opsiyonel). */}
        <Field label="E-posta (opsiyonel)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="ornek@eposta.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label="Telefon">
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

        <Field label="Doğum Tarihi">
          <BirthDateInput value={birthDate} onChange={setBirthDate} onFocus={handleFocus} />
        </Field>

        <Field label="Öğrenim Durumu">
          <View style={styles.chipGrid}>
            {EDUCATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, educationLevel === opt.value && styles.chipActive]}
                onPress={() => setEducationLevel(educationLevel === opt.value ? null : opt.value)}
              >
                <Text style={[styles.chipText, educationLevel === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Cinsiyet">
          <View style={styles.chipGrid}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, gender === opt.value && styles.chipActive]}
                onPress={() => setGender(gender === opt.value ? null : opt.value)}
              >
                <Text style={[styles.chipText, gender === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Adres">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Adres"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Acil Durum Kişisi — Ad Soyad">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={emergencyName}
            onChangeText={setEmergencyName}
            placeholder="Ad Soyad"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Acil Durum Kişisi — Telefon">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={emergencyPhone}
            onChangeText={(v) => setEmergencyPhone(formatPhoneNumber(v))}
            keyboardType="phone-pad"
            placeholder="0532-123-45-67"
            placeholderTextColor={colors.muted}
            maxLength={14}
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.removeButton} onPress={handleRemoveCoach} disabled={removing}>
          {removing ? <ActivityIndicator color={colors.coral} /> : <Text style={styles.removeButtonText}>Antrenörü Kulüpten Çıkar</Text>}
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
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputDisabled: { opacity: 0.6 },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.bg },
  photoPicker: {
    width: 96, height: 96, borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  photoPreview: { width: 96, height: 96 },
  photoPlaceholderText: { color: colors.muted, fontSize: 11, textAlign: "center", paddingHorizontal: 8 },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  removeButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.md, marginBottom: spacing.xl,
  },
  removeButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
