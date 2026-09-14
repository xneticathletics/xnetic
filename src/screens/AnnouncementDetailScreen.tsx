import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Linking, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import {
  getAnnouncement, markAnnouncementRead, getAnnouncementReaders, getAnnouncementTargetDetails,
  type Announcement, type AnnouncementReader, type AnnouncementTarget,
} from "../lib/api/announcements";

const TARGET_LABEL: Record<AnnouncementTarget, string> = {
  club: "Tüm Kulüp", group: "Branşlar/Gruplar", athletes: "Sporcular", parents: "Veliler", coaches: "Antrenörler",
};

// Ekran kaydırılabilir değil (altında sabit yükseklikte Okuyanlar listesi
// var) — çok uzun bir isim listesi sayfayı taşırmasın diye kısaltılıyor.
const MAX_NAMES_SHOWN = 12;
function formatNameList(names: string[]): string {
  if (names.length <= MAX_NAMES_SHOWN) return names.join(", ");
  return `${names.slice(0, MAX_NAMES_SHOWN).join(", ")} +${names.length - MAX_NAMES_SHOWN} tane daha`;
}
// ProfileStack tarafından mount ediliyor — bkz. AnnouncementsScreen.tsx'teki
// aynı gerekçe.
type AnnouncementsRouteParamList = {
  AnnouncementDetail: { announcementId: string };
};
type Props = NativeStackScreenProps<AnnouncementsRouteParamList, "AnnouncementDetail">;

export default function AnnouncementDetailScreen({ route, navigation }: Props) {
  const { announcementId } = route.params;
  const { role } = useAuth();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [readers, setReaders] = useState<AnnouncementReader[]>([]);
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [recipientNames, setRecipientNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'dan sekmeler arası (Profil sekmesine) programatik olarak
  // gelindiğinde, Profil sekmesinin geçmişinde "Profile" ekranı olmayabilir
  // — bu durumda varsayılan geri oku görünmeyebiliyor. Bu yüzden her zaman
  // görünen açık bir "Ana Sayfa" butonu ekliyoruz.
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => (navigation.getParent()?.navigate as any)("Ana Menü", { screen: "Home" })}
          style={{ paddingHorizontal: 4 }}
        >
          <Text style={{ color: colors.yellow, fontWeight: "700", fontSize: 15 }}>🏠 Ana Sayfa</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Okuyan isim/saat listesi yalnızca Admin ve Antrenör'e gösterilir.
  const canSeeReaders = role === "club_admin" || role === "coach";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        // Üçü de birbirinden bağımsız — okundu kaydı, duyurunun kendisi ve
        // (varsa) okuyanlar listesi ayrı ayrı sıra sıra beklenmek yerine
        // paralel çekiliyor. Okundu kaydı sessizce tutulur — kullanıcıya
        // ayrıca bir onay metni gösterilmez (bilinçli tasarım kararı).
        const [, found, readerList] = await Promise.all([
          markAnnouncementRead(announcementId),
          getAnnouncement(announcementId),
          canSeeReaders ? getAnnouncementReaders(announcementId) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setAnnouncement(found);
          setReaders(readerList);
        }
        // Kime gönderildiğinin isim çözümü, duyuru elimize geçtikten SONRA
        // yapılabiliyor (target_ids/target_user_ids ona bağlı) — bu yüzden
        // yukarıdaki Promise.all'a dahil edilmedi, ayrıca ve sadece
        // admin/antrenöre (canSeeReaders) gösteriliyor.
        if (canSeeReaders) {
          const details = await getAnnouncementTargetDetails(found);
          if (!cancelled) {
            setGroupNames(details.groupNames);
            setRecipientNames(details.recipientNames);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Duyuru yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [announcementId, canSeeReaders]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !announcement) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Duyuru bulunamadı"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{new Date(announcement.created_at).toLocaleDateString("tr-TR")}</Text>
      <Text style={styles.title}>{announcement.title}</Text>
      <Text style={styles.body}>{announcement.body}</Text>

      {!!announcement.attachment_url && <AnnouncementAttachment url={announcement.attachment_url} />}

      {canSeeReaders && (
        <View style={styles.targetSection}>
          <Text style={styles.readersTitle}>Kime Gönderildi</Text>
          <Text style={styles.targetLine}>
            {announcement.target_types.map((t) => TARGET_LABEL[t] ?? t).join(", ")}
          </Text>
          {groupNames.length > 0 && (
            <Text style={styles.targetLine}>Gruplar: {formatNameList(groupNames)}</Text>
          )}
          {recipientNames.length > 0 && (
            <Text style={styles.targetLine}>
              Seçilen kişiler ({recipientNames.length}): {formatNameList(recipientNames)}
            </Text>
          )}
        </View>
      )}

      {canSeeReaders && (
        <View style={styles.readersSection}>
          <Text style={styles.readersTitle}>Okuyanlar ({readers.length})</Text>
          <FlatList
            data={readers}
            keyExtractor={(r) => r.user_id}
            ListEmptyComponent={<Text style={styles.empty}>Henüz kimse okumadı.</Text>}
            renderItem={({ item }) => (
              <View style={styles.readerRow}>
                <Text style={styles.readerName}>✓ {item.name}</Text>
                <Text style={styles.readerDate}>
                  {new Date(item.read_at).toLocaleDateString("tr-TR")}{" "}
                  {new Date(item.read_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "heic"];

// Ek görsel ise ekranda doğrudan gösterir; değilse (video/belge) cihazın
// kendi uygulamasında (galeri, doküman görüntüleyici vb.) açması için bir
// buton gösterir — 1 MB sınırı sayesinde her tür dosya zaten çok küçük.
function AnnouncementAttachment({ url }: { url: string }) {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
  const isImage = IMAGE_EXTENSIONS.includes(ext);

  if (isImage) {
    return <Image source={{ uri: url }} style={styles.attachmentImage} resizeMode="cover" />;
  }

  return (
    <TouchableOpacity
      style={styles.attachmentButton}
      onPress={() => Linking.openURL(url).catch(() => Alert.alert("Açılamadı", "Ek dosya açılamadı.", [{ text: "Tamam" }]))}
    >
      <Text style={styles.attachmentButtonText}>📎 Ek Dosyayı Aç</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral, textAlign: "center" },
  date: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  attachmentImage: { width: "100%", height: 220, borderRadius: radius.md, marginTop: spacing.md, backgroundColor: colors.surface },
  attachmentButton: {
    borderWidth: 1, borderColor: colors.teal, borderRadius: radius.md, paddingVertical: 12,
    alignItems: "center", marginTop: spacing.md,
  },
  attachmentButtonText: { color: colors.teal, fontWeight: "700", fontSize: 13 },
  targetSection: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, gap: 4 },
  targetLine: { color: colors.ink, fontSize: 12, lineHeight: 17 },
  readersSection: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, flex: 1 },
  readersTitle: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: spacing.sm, textTransform: "uppercase" },
  empty: { color: colors.muted, fontSize: 13 },
  readerRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  readerName: { color: colors.teal, fontSize: 14, fontWeight: "600" },
  readerDate: { color: colors.muted, fontSize: 12 },
});
