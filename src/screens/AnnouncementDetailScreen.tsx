import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import {
  listAnnouncements, markAnnouncementRead, getAnnouncementReaders,
  type Announcement, type AnnouncementReader,
} from "../lib/api/announcements";
// ProfileStack ve AnnouncementsStack'in ikisinden de mount edilebiliyor —
// bkz. AnnouncementsScreen.tsx'teki aynı gerekçe.
type AnnouncementsRouteParamList = {
  AnnouncementDetail: { announcementId: string };
};
type Props = NativeStackScreenProps<AnnouncementsRouteParamList, "AnnouncementDetail">;

export default function AnnouncementDetailScreen({ route, navigation }: Props) {
  const { announcementId } = route.params;
  const { role } = useAuth();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [readers, setReaders] = useState<AnnouncementReader[]>([]);
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
        // Okundu kaydı sessizce tutulur — kullanıcıya ayrıca bir onay
        // metni gösterilmez (bilinçli tasarım kararı).
        await markAnnouncementRead(announcementId);
        const all = await listAnnouncements();
        const found = all.find((a) => a.id === announcementId) ?? null;
        if (!cancelled) setAnnouncement(found);
        if (canSeeReaders) {
          const readerList = await getAnnouncementReaders(announcementId);
          if (!cancelled) setReaders(readerList);
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral, textAlign: "center" },
  date: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  readersSection: { marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, flex: 1 },
  readersTitle: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: spacing.sm, textTransform: "uppercase" },
  empty: { color: colors.muted, fontSize: 13 },
  readerRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  readerName: { color: colors.teal, fontSize: 14, fontWeight: "600" },
  readerDate: { color: colors.muted, fontSize: 12 },
});
