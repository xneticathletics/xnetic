import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getClubLogoUrl, uploadClubLogo } from "../lib/api/clubLogo";
import { getClubName, updateClubName } from "../lib/api/clubSettings";
import { useAuth } from "../context/AuthContext";
import type { ClubSettingsStackParamList } from "../navigation/ClubSettingsStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<ClubSettingsStackParamList, "ClubLogo">;

export default function ClubLogoScreen({}: Props) {
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [logoUrl, setLogoUrl] = useState(clubId ? getClubLogoUrl(clubId) : "");
  const [logoFailed, setLogoFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clubName, setClubName] = useState("");
  const [nameLoading, setNameLoading] = useState(true);
  const [nameSaving, setNameSaving] = useState(false);
  useEffect(() => {
    if (!clubId) { setNameLoading(false); return; }
    getClubName(clubId)
      .then((n) => setClubName(n ?? ""))
      .finally(() => setNameLoading(false));
  }, [clubId]);

  const handlePick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    if (!clubId) return;

    setUploading(true);
    try {
      const url = await uploadClubLogo(result.assets[0].uri, clubId);
      setLogoUrl(url);
      setLogoFailed(false);
      Alert.alert("Kaydedildi", "Kulüp logosu güncellendi — Ana Sayfa'da görünecek.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!clubName.trim()) {
      Alert.alert("Eksik bilgi", "Kulüp adı boş bırakılamaz.", [{ text: "Tamam" }]);
      return;
    }
    if (!clubId) return;
    setNameSaving(true);
    try {
      await updateClubName(clubId, clubName.trim());
      Alert.alert("Kaydedildi", "Kulüp adı güncellendi — Ana Sayfa'da görünecek.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Ana Sayfa'da görünecek kulüp adı ve logosu. Logo için kare (1:1) bir görsel öneriyoruz.
        </Text>

        <TouchableOpacity style={styles.logoBox} onPress={handlePick} disabled={uploading}>
          {logoFailed ? (
            <Text style={styles.placeholderText}>Henüz logo yüklenmedi</Text>
          ) : (
            <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" onError={() => setLogoFailed(true)} />
          )}
          {uploading && (
            <View style={styles.overlay}>
              <ActivityIndicator color={colors.ink} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handlePick} disabled={uploading}>
          <Text style={styles.buttonText}>{logoFailed ? "Logo Yükle" : "Logoyu Değiştir"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Kulüp Adı</Text>
        {nameLoading ? (
          <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.sm }} />
        ) : (
          <>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={clubName}
              onChangeText={setClubName}
              placeholder="Örn. X-NETIC Spor Kulübü"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity style={styles.nameSaveButton} onPress={handleSaveName} disabled={nameSaving}>
              {nameSaving ? (
                <ActivityIndicator color={colors.teal} />
              ) : (
                <Text style={styles.nameSaveButtonText}>Kulüp Adını Kaydet</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: spacing.lg, lineHeight: 18 },
  logoBox: {
    width: 160, height: 160, alignSelf: "center", backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg, overflow: "hidden",
  },
  logoImage: { width: "100%", height: "100%" },
  placeholderText: { color: colors.muted, fontSize: 12, textAlign: "center", paddingHorizontal: spacing.md },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginBottom: spacing.xl },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  nameSaveButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  nameSaveButtonText: { color: colors.teal, fontWeight: "700", fontSize: 15 },
});
