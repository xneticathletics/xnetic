import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
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
import { requestAccountDeletion } from "../lib/api/accountDeletion";

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
  const [requestingDeletion, setRequestingDeletion] = useState(false);

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

  const handleDeleteAccountRequest = () => {
    if (role === "super_admin") {
      Alert.alert("Kullanılamıyor", "Süper admin hesabı için bu özellik kullanılamıyor.", [{ text: "Tamam" }]);
      return;
    }
    Alert.alert(
      "Hesabını silmek istiyor musun?",
      "Bu talebini kulüp yönetimine ileteceğiz — incelendikten sonra hesabın ve kişisel verilerin KVKK sürecine uygun şekilde kapatılacak. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Talep Gönder",
          style: "destructive",
          onPress: async () => {
            setRequestingDeletion(true);
            try {
              await requestAccountDeletion(role);
              Alert.alert("Talebin İletildi", "Hesap silme talebin kulüp yönetimine iletildi.", [{ text: "Tamam" }]);
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Talep gönderilemedi", [{ text: "Tamam" }]);
            } finally {
              setRequestingDeletion(false);
            }
          },
        },
      ]
    );
  };

  const initial = (userName ?? ROLE_LABEL[role])[0]?.toUpperCase() ?? "?";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.headerCard}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handlePickPhoto}
          disabled={!canUpload || uploading}
          activeOpacity={canUpload ? 0.7 : 1}
          accessibilityLabel="Profil fotoğrafını değiştir"
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

      {/* Kulüp Ayarları sadece Kulüp Admini'nde (alt menüde artık ayrı bir
          "Ayarlar" sekmesi YOK, buradan girilir); Duyurular Süper Admin
          hariç herkeste (alt menüde artık ayrı bir "Duyurular" sekmesi de
          YOK — bkz. RoleTabs.tsx). Süper Admin'in kendi kulübü yok, duyuru
          kulüp-içi bir kavram, bu yüzden o hariç. Diğer ayar kutucuklarıyla
          aynı kutu stilinde — tek satır kart yerine iki de burada. */}
      {role !== "super_admin" && (
        <View style={styles.settingsGrid}>
          {role === "club_admin" && (
            <TouchableOpacity style={styles.settingsTile} onPress={() => navigation.navigate("ClubSettings")}>
              <View style={styles.settingsIconBadge}>
                <Text style={styles.settingsIcon}>⚙️</Text>
              </View>
              <Text style={styles.settingsTitle}>Kulüp Ayarları</Text>
              <Text style={styles.settingsSub}>Grup, branş, kullanıcı ve diğer ayarlar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingsTile} onPress={() => navigation.navigate("Announcements")}>
            <View style={[styles.settingsIconBadge, { backgroundColor: colors.coralSoft }]}>
              <Text style={styles.settingsIcon}>📣</Text>
            </View>
            <Text style={styles.settingsTitle}>Duyurular</Text>
            <Text style={styles.settingsSub}>Tüm duyuruları görüntüle</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.settingsGrid}>
        <TouchableOpacity style={styles.settingsTile} onPress={() => navigation.navigate("PersonalInfo")}>
          <View style={styles.settingsIconBadge}>
            <Text style={styles.settingsIcon}>👤</Text>
          </View>
          <Text style={styles.settingsTitle}>Kişisel Bilgiler</Text>
          <Text style={styles.settingsSub}>Ad, telefon, fotoğraf</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsTile} onPress={() => navigation.navigate("ChangePassword")}>
          <View style={[styles.settingsIconBadge, { backgroundColor: colors.tealSoft }]}>
            <Text style={styles.settingsIcon}>🔒</Text>
          </View>
          <Text style={styles.settingsTitle}>Giriş ve Şifre İşlemleri</Text>
          <Text style={styles.settingsSub}>Giriş bilgisi, şifre</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsGrid}>
        <TouchableOpacity style={styles.settingsTile} onPress={() => navigation.navigate("NotificationPreferences")}>
          <View style={[styles.settingsIconBadge, { backgroundColor: colors.coralSoft }]}>
            <Text style={styles.settingsIcon}>🔔</Text>
          </View>
          <Text style={styles.settingsTitle}>Bildirim Tercihleri</Text>
          <Text style={styles.settingsSub}>Almak istemediklerin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsTile} onPress={() => navigation.navigate("Support")}>
          <View style={[styles.settingsIconBadge, { backgroundColor: colors.tealSoft }]}>
            <Text style={styles.settingsIcon}>💬</Text>
          </View>
          <Text style={styles.settingsTitle}>Yardım / Destek</Text>
          <Text style={styles.settingsSub}>destek@xnetic.net</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteAccountLink}
        onPress={handleDeleteAccountRequest}
        disabled={requestingDeletion}
      >
        <Text style={styles.deleteAccountLinkText}>Hesabımı Sil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // flexGrow:1 + altta flex:1'lik boş View (bkz. render): içerik ekrana
  // sığdığında "Çıkış Yap"/"Hesabımı Sil" hep en altta durur; sığmadığında
  // (ör. Kulüp Admini'nde ekstra kartlar varken) ScrollView devreye girip
  // kaydırılabiliyor — bu ikisi eskiden (View, ScrollView değilken) sığmayan
  // içerikte "Hesabımı Sil"in ekran dışına taşıp kaybolmasına yol açmıştı.
  // Alt sekme çubuğunun üstünden taşan yuvarlak Asistan logosu (bkz.
  // RoleTabs.tsx) ekranın en alt ~35px'ine biniyor — ekstra bir alt boşluk
  // bu yüzden var.
  content: {
    flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg + 36,
  },
  headerCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarWrapper: { marginBottom: spacing.md },
  avatar: {
    width: 92, height: 92, borderRadius: radius.full,
    backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 92, height: 92, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 34, fontWeight: "800" },
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
  settingsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  settingsTile: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.sm + 4,
  },
  settingsIconBadge: {
    width: 36, height: 36, borderRadius: radius.md, marginBottom: 6,
    backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center",
  },
  settingsIcon: { fontSize: 17 },
  settingsTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  settingsSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
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
  deleteAccountLink: { alignItems: "center", paddingVertical: spacing.sm },
  deleteAccountLinkText: { color: colors.muted, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
});
