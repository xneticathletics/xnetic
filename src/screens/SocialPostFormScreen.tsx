import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createSocialPost, listMyBranches } from "../lib/api/socialPosts";
import BranchPickerModal from "../components/BranchPickerModal";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { Branch } from "../lib/api/branches";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SocialPostForm">;

export default function SocialPostFormScreen({ navigation }: Props) {
  const { role } = useAuth();
  // Koordinatör (antrenör + isLocked) kendi branşına kilitli paylaşır —
  // diğer herkes (plain antrenör, veli, sporcu, admin) kendi bağlı olduğu
  // branş(lar) arasından seçer.
  const { selectedBranch, isLocked } = useBranchSelect();
  const isBranchCoordinator = role === "coach" && isLocked;

  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [myBranches, setMyBranches] = useState<string[]>([]);
  const [branch, setBranch] = useState<string | null>(isBranchCoordinator ? selectedBranch : null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(!isBranchCoordinator);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isBranchCoordinator) return;
    listMyBranches(role)
      .then((names) => {
        setMyBranches(names);
        if (names.length === 1) setBranch(names[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingBranches(false));
  }, [role, isBranchCoordinator]);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf/video seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setLocalUri(asset.uri);
    setMediaType(asset.type === "video" ? "video" : "photo");
  };

  const handleShare = async () => {
    if (savingRef.current) return;
    if (!branch) return Alert.alert("Eksik bilgi", "Bir branş seçmelisin.", [{ text: "Tamam" }]);
    if (!localUri || !mediaType) return Alert.alert("Eksik bilgi", "Bir fotoğraf ya da video seçmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const post = await createSocialPost({ branch, localUri, mediaType, caption: caption.trim() || undefined });
      if (post.status === "pending") {
        Alert.alert(
          "Onay bekliyor",
          "Paylaşımın branşının antrenör/koordinatörü onayladıktan sonra Sosyal Alan'da görünecek.",
          [{ text: "Tamam", onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      setError(e.message ?? "Paylaşılamadı");
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
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 4 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Fotoğraf / Video *">
          <TouchableOpacity
            style={styles.mediaSlot}
            onPress={pickMedia}
            accessibilityLabel={localUri ? "Fotoğrafı/videoyu değiştir" : "Fotoğraf veya video seç"}
          >
            {localUri && mediaType === "photo" ? (
              <Image source={{ uri: localUri }} style={styles.mediaPreviewImage} resizeMode="cover" />
            ) : localUri && mediaType === "video" ? (
              <Text style={styles.mediaAddText}>🎬 Video seçildi — değiştirmek için dokun</Text>
            ) : (
              <Text style={styles.mediaAddText}>+ Fotoğraf / Video Seç</Text>
            )}
          </TouchableOpacity>
        </Field>

        <Field label="Branş *">
          {isBranchCoordinator ? (
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={{ color: colors.muted }}>{selectedBranch}</Text>
            </View>
          ) : loadingBranches ? (
            <ActivityIndicator color={colors.yellow} />
          ) : myBranches.length <= 1 ? (
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={{ color: myBranches[0] ? colors.ink : colors.coral }}>
                {myBranches[0] ?? "Bağlı olduğun bir branş bulunamadı"}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.input} onPress={() => setBranchPickerVisible(true)}>
              <Text style={{ color: branch ? colors.ink : colors.muted }}>{branch ?? "Branş seç"}</Text>
            </TouchableOpacity>
          )}
        </Field>

        <Field label="Not (isteğe bağlı)">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Bu paylaşımla ilgili kısa bir not"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleShare} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Paylaş</Text>}
        </TouchableOpacity>

        <BranchPickerModal
          visible={branchPickerVisible}
          selectedName={branch}
          allowedNames={myBranches}
          onSelect={(b: Branch) => setBranch(b.name)}
          onClose={() => setBranchPickerVisible(false)}
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
  inputDisabled: { justifyContent: "center" },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  mediaSlot: {
    width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  mediaPreviewImage: { width: "100%", height: "100%" },
  mediaAddText: { color: colors.muted, fontSize: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
