import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth, type UserRole } from "../context/AuthContext";
import {
  getCurrentUserName, getCurrentUserPhone, getCurrentUserPhoto, getCurrentAppUserId, updateMyProfile, uploadMyPhoto,
} from "../lib/api/currentUser";
import { getMyAthletes } from "../lib/api/myAthletes";
import { uploadAthletePhoto } from "../lib/api/athletes";
import { getCoach, updateCoach, getCoachBranches, updateMyCoachBranchDetails, type CoachBranchInfo } from "../lib/api/coaches";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { formatPhoneNumber } from "../lib/phoneFormat";
import BirthDateInput from "../components/BirthDateInput";
import { cropToSquare } from "../lib/cropToSquare";
// Veli'nin kendi fotoğraf yükleme hakkı yok (Profil ekranındaki kuralla
// aynı) — Sporcu kendi athletes kaydını, diğerleri kendi users kaydını günceller.
const CAN_UPLOAD_PHOTO: Record<UserRole, boolean> = {
  club_admin: true, coach: true, parent: false, athlete: true, super_admin: true,
};

const EDUCATION_OPTIONS: { value: string; label: string }[] = [
  { value: "lise", label: "Lise" },
  { value: "universite", label: "Üniversite" },
  { value: "yuksek_lisans", label: "Yüksek Lisans" },
  { value: "doktora", label: "Doktora" },
];

export default function PersonalInfoScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const headerHeight = useHeaderHeight();
  const { role } = useAuth();
  const canUploadPhoto = CAN_UPLOAD_PHOTO[role as UserRole];

  const isCoach = role === "coach";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [myAthleteId, setMyAthleteId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Sadece Antrenör'de gösterilen ek alanlar — Kulüp Ayarları →
  // Antrenörler'den admin'in düzenleyebildiği her şeyi (CoachFormScreen)
  // antrenör artık kendi Profil Ayarları'ndan da yapabilsin diye.
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // Branş bazlı belge no / deneyim yılı — antrenör kendi girdiği/güncellediği
  // metni yerel state'te tutup Kaydet'e basınca tek tek gönderiyor (branş ve
  // kademeye dokunmuyor, RLS de zaten bunu izin vermiyor — bkz.
  // coach_branches_self_update migration'ı).
  const [myBranches, setMyBranches] = useState<CoachBranchInfo[]>([]);
  const [branchEdits, setBranchEdits] = useState<Record<string, { license_no: string; experience_years: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışabiliyordu. Senkron bir
  // ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          // Aşağıdaki 4 çağrının hiçbiri birbirinin sonucuna bağlı değil
          // (coach için getCoach ayrı adımda, çünkü userId'ye ihtiyaç duyuyor) —
          // tek Promise.all'da toplayıp gereksiz ardışık bekleyişi kaldırıyoruz.
          const [n, p, athleteOrPhoto, coachUserId] = await Promise.all([
            getCurrentUserName(),
            getCurrentUserPhone(),
            role === "athlete" ? getMyAthletes() : getCurrentUserPhoto(),
            role === "coach" ? getCurrentAppUserId() : Promise.resolve(null),
          ]);
          if (cancelled) return;
          setName(n ?? "");
          setPhone(p ?? "");

          if (role === "athlete") {
            const athletes = athleteOrPhoto as Awaited<ReturnType<typeof getMyAthletes>>;
            if (athletes.length > 0) {
              setMyAthleteId(athletes[0].id);
              setPhotoUrl(athletes[0].photo_url);
            }
          } else {
            setPhotoUrl(athleteOrPhoto as string | null);
          }

          if (role === "coach" && coachUserId) {
            const [c, branches] = await Promise.all([getCoach(coachUserId), getCoachBranches(coachUserId)]);
            if (!cancelled) {
              setBirthDate(c.birth_date);
              setEducationLevel(c.education_level);
              setAddress(c.address ?? "");
              setEmergencyName(c.emergency_contact_name ?? "");
              setEmergencyPhone(c.emergency_contact_phone ?? "");
              setContactEmail(c.contact_email ?? "");
              setMyBranches(branches);
              setBranchEdits(
                Object.fromEntries(
                  branches.map((b) => [
                    b.branch_id,
                    { license_no: b.license_no ?? "", experience_years: b.experience_years != null ? String(b.experience_years) : "" },
                  ])
                )
              );
            }
          }
        } catch (e: any) {
          if (!cancelled) setError(e.message);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [role])
  );

  const handlePickPhoto = async () => {
    if (!canUploadPhoto) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const uri = await cropToSquare(asset.uri, asset.width, asset.height);
      const url = role === "athlete" && myAthleteId
        ? await uploadAthletePhoto(myAthleteId, uri)
        : await uploadMyPhoto(uri);
      setPhotoUrl(url);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Fotoğraf yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!name.trim()) {
      Alert.alert("Eksik bilgi", "Ad Soyad boş bırakılamaz.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({ name: name.trim(), phone: phone.trim() || null });
      if (isCoach) {
        const userId = await getCurrentAppUserId();
        if (userId) {
          await updateCoach(userId, {
            birth_date: birthDate,
            education_level: educationLevel,
            address: address.trim() || null,
            emergency_contact_name: emergencyName.trim() || null,
            emergency_contact_phone: emergencyPhone.trim() || null,
            contact_email: contactEmail.trim() || null,
          });
          await Promise.all(
            myBranches.map((b) => {
              const edit = branchEdits[b.branch_id];
              if (!edit) return Promise.resolve();
              return updateMyCoachBranchDetails(b.branch_id, {
                license_no: edit.license_no.trim() || null,
                experience_years: edit.experience_years.trim() ? Number(edit.experience_years.trim()) : null,
              });
            })
          );
        }
      }
      Alert.alert("Kaydedildi", "Bilgilerin güncellendi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  const initial = (name || "?")[0]?.toUpperCase() ?? "?";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickPhoto}
            disabled={!canUploadPhoto || uploadingPhoto}
            activeOpacity={canUploadPhoto ? 0.7 : 1}
            accessibilityLabel="Profil fotoğrafını değiştir"
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.ink} />
              </View>
            )}
            {canUploadPhoto && !uploadingPhoto && (
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>✎</Text>
              </View>
            )}
          </TouchableOpacity>
          {canUploadPhoto ? (
            <Text style={styles.photoHint}>Değiştirmek için dokun</Text>
          ) : (
            <Text style={styles.photoHint}>Veli hesaplarında profil fotoğrafı bulunmuyor</Text>
          )}
        </View>

        <SectionHeader title="Kişisel Bilgiler" />

        <Field label="Ad Soyad">
          <TextInput
          onFocus={handleFocus} style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.muted} />
        </Field>

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

        {isCoach && (
          <>
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: educationLevel === opt.value }}
                  >
                    <Text style={[styles.chipText, educationLevel === opt.value && styles.chipTextActive]}>{opt.label}</Text>
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

            {myBranches.length > 0 && (
              <>
                <SectionHeader title="Branş — Belge ve Deneyim" />
                {myBranches.map((b) => (
                  <View key={b.branch_id} style={styles.branchDetailBox}>
                    <Text style={styles.branchDetailTitle}>{b.branch_name}</Text>
                    <Field label="Belge / Lisans Numarası">
                      <TextInput
                        onFocus={handleFocus}
                        style={styles.input}
                        value={branchEdits[b.branch_id]?.license_no ?? ""}
                        onChangeText={(v) =>
                          setBranchEdits((prev) => ({ ...prev, [b.branch_id]: { ...prev[b.branch_id], license_no: v } }))
                        }
                        placeholder="Belge/lisans no"
                        placeholderTextColor={colors.muted}
                      />
                    </Field>
                    <Field label="Deneyim Yılı">
                      <TextInput
                        onFocus={handleFocus}
                        style={styles.input}
                        value={branchEdits[b.branch_id]?.experience_years ?? ""}
                        onChangeText={(v) =>
                          setBranchEdits((prev) => ({
                            ...prev,
                            [b.branch_id]: { ...prev[b.branch_id], experience_years: v.replace(/[^0-9]/g, "") },
                          }))
                        }
                        keyboardType="number-pad"
                        placeholder="Ör. 5"
                        placeholderTextColor={colors.muted}
                      />
                    </Field>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderBar} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
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
  photoSection: { alignItems: "center", marginBottom: spacing.lg },
  avatarWrapper: { marginBottom: spacing.sm },
  avatar: {
    width: 88, height: 88, borderRadius: radius.full,
    backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 88, height: 88, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 32, fontWeight: "800" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject, borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.bg,
  },
  avatarEditIcon: { fontSize: 13, color: colors.bg },
  photoHint: { color: colors.muted, fontSize: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionHeaderBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  sectionHeaderText: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  branchDetailBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  branchDetailTitle: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: spacing.sm },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
