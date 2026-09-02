import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth, type UserRole } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/tokens";
import type { ProfileStackParamList } from "../navigation/ProfileStack";
import { getCurrentUserName, getCurrentUserPhoto, uploadMyPhoto } from "../lib/api/currentUser";
import { getMyAthletes } from "../lib/api/myAthletes";
import { uploadAthletePhoto, updateAthlete } from "../lib/api/athletes";
import { useBranchSelect } from "../context/BranchSelectContext";

const ROLE_LABEL: Record<UserRole, string> = {
  club_admin: "Kulüp Yöneticisi",
  coach: "Antrenör",
  parent: "Veli",
  athlete: "Sporcu",
  super_admin: "Süper Admin",
};

// Veli hariç herkes kendi profil fotoğrafını yükleyebilir — Sporcu kendi
// athletes kaydındaki fotoğrafı, diğerleri (Antrenör vb.) users
// tablosundaki kendi fotoğraflarını günceller.
const CAN_UPLOAD_PHOTO: Record<UserRole, boolean> = {
  club_admin: true,
  coach: true,
  parent: false,
  athlete: true,
  super_admin: true,
};

export default function ProfileScreen({
  role,
  navigation,
}: {
  role: UserRole;
  navigation: NativeStackNavigationProp<ProfileStackParamList, "Profile">;
}) {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { selectedBranch, isLocked } = useBranchSelect();
  const isBranchCoordinator = role === "coach" && isLocked;
  const [userName, setUserName] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [myAthleteId, setMyAthleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const canUpload = CAN_UPLOAD_PHOTO[role];

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const name = await getCurrentUserName();
          if (!cancelled) setUserName(name);

          if (role === "athlete") {
            const athletes = await getMyAthletes();
            if (!cancelled && athletes.length > 0) {
              setMyAthleteId(athletes[0].id);
              setPhotoUrl(athletes[0].photo_url);
            }
          } else {
            const photo = await getCurrentUserPhoto();
            if (!cancelled) setPhotoUrl(photo);
          }
        } catch {
          // Sessizce yut — profil ekranı kritik olmayan bir ekran, hata
          // burada kullanıcıyı bloklamamalı.
        }
      })();
      return () => { cancelled = true; };
    }, [role])
  );

  const handlePickPhoto = async () => {
    if (!canUpload) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      let url: string;
      if (role === "athlete" && myAthleteId) {
        url = await uploadAthletePhoto(myAthleteId, uri);
        await updateAthlete(myAthleteId, { photo_url: url });
      } else {
        url = await uploadMyPhoto(uri);
      }
      setPhotoUrl(url);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Fotoğraf yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setUploading(false);
    }
  };

  const initial = (userName ?? ROLE_LABEL[role])[0]?.toUpperCase() ?? "?";

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.headerCard}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handlePickPhoto}
          disabled={!canUpload || uploading}
          activeOpacity={canUpload ? 0.7 : 1}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.ink} />
            </View>
          )}
          {canUpload && !uploading && (
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{userName ?? "…"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{ROLE_LABEL[role]}</Text>
        </View>
        {isBranchCoordinator && selectedBranch && (
          <View style={styles.coordinatorBadge}>
            <Text style={styles.coordinatorBadgeText}>🏷 Branş Koordinatörü — {selectedBranch}</Text>
          </View>
        )}
      </View>

      {role !== "super_admin" && (
        <TouchableOpacity style={styles.announcementsCard} onPress={() => navigation.navigate("Announcements")}>
          <View style={styles.announcementsIconBadge}>
            <Text style={styles.announcementsIcon}>📣</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.announcementsTitle}>Duyurular</Text>
            <Text style={styles.announcementsSub}>Tüm duyuruları görüntüle</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.settingsCard} onPress={() => navigation.navigate("ProfileSettings")}>
        <View style={styles.settingsIconBadge}>
          <Text style={styles.settingsIcon}>👤</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingsTitle}>Profil Ayarları</Text>
          <Text style={styles.settingsSub}>Ad, telefon gibi kişisel bilgilerin</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  headerCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatarWrapper: { marginBottom: spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 72, height: 72, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 28, fontWeight: "800" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.surface,
  },
  avatarEditIcon: { fontSize: 12, color: colors.bg },
  name: { color: colors.ink, fontSize: 19, fontWeight: "700" },
  roleBadge: {
    marginTop: spacing.xs, backgroundColor: colors.tealSoft,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  roleBadgeText: { color: colors.teal, fontSize: 12, fontWeight: "700" },
  coordinatorBadge: {
    marginTop: spacing.sm, backgroundColor: colors.tealSoft,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  coordinatorBadgeText: { color: colors.teal, fontWeight: "700", fontSize: 13 },
  announcementsCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm,
  },
  announcementsIconBadge: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center",
  },
  announcementsIcon: { fontSize: 22 },
  announcementsTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  announcementsSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  settingsCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm,
  },
  settingsIconBadge: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.tealSoft, alignItems: "center", justifyContent: "center",
  },
  settingsIcon: { fontSize: 22 },
  settingsTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  settingsSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.yellow, fontSize: 24, fontWeight: "700" },
  button: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  buttonText: { color: colors.coral, fontWeight: "700" },
});
