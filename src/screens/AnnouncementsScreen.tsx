import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { listAnnouncements, filterAnnouncementsForViewer, type Announcement } from "../lib/api/announcements";
import { getMyAthletes } from "../lib/api/myAthletes";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import { useClubSettings } from "../context/ClubSettingsContext";

// Hem ProfileStack (Kulüp Admini/Süper Admin'de, Profil'in içinden) hem
// AnnouncementsStack (Antrenör/Veli/Sporcu'da, kendi bağımsız "Duyurular"
// sekmesi) tarafından mount ediliyor — belirli bir üst stack'e bağlı
// kalmamak için kendi minimal parametre listesini tanımlıyor.
type AnnouncementsRouteParamList = {
  Announcements: undefined;
  AnnouncementDetail: { announcementId: string };
  AnnouncementForm: undefined;
};
type Props = NativeStackScreenProps<AnnouncementsRouteParamList, "Announcements">;

const TARGET_LABEL: Record<string, string> = {
  club: "Tüm Kulüp", group: "Grup", athletes: "Sporcular", parents: "Veliler", coaches: "Antrenörler",
};

export default function AnnouncementsScreen({ navigation }: Props) {
  const { role } = useAuth();
  const { settings } = useClubSettings();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await listAnnouncements();

      let myGroupIds: string[] = [];
      if (role === "parent" || role === "athlete") {
        const athletes = await getMyAthletes();
        myGroupIds = athletes.map((a) => a.group_id).filter((id): id is string => !!id);
      } else if (role === "coach") {
        myGroupIds = await getMyCoachedGroupIds();
      }

      const visibilityMs = settings.announcement_visibility_days * 24 * 60 * 60 * 1000;
      const recentOnly = all.filter((a) => Date.now() - new Date(a.created_at).getTime() <= visibilityMs);
      setItems(filterAnnouncementsForViewer(recentOnly, role ?? "", myGroupIds));
    } catch (e: any) {
      setError(e.message ?? "Duyurular yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [role, settings.announcement_visibility_days]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      {role === "club_admin" && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AnnouncementForm")}>
            <Text style={styles.addButtonText}>+ Duyuru Yap</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz duyuru yok.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("AnnouncementDetail", { announcementId: item.id })}
          >
            {role === "club_admin" ? (
              <>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTag}>
                    {item.target_types.map((t) => TARGET_LABEL[t] ?? t).join(", ")}
                  </Text>
                  <Text style={styles.rowDate}>{new Date(item.created_at).toLocaleDateString("tr-TR")}</Text>
                </View>
                <Text style={styles.rowTitle}>{item.title}</Text>
              </>
            ) : (
              <View style={styles.rowTopInline}>
                <Text style={styles.rowTitleInline} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowDate}>{new Date(item.created_at).toLocaleDateString("tr-TR")}</Text>
              </View>
            )}
            <Text style={styles.rowBody} numberOfLines={1}>{item.body}</Text>
            {!!item.attachment_url && <Text style={styles.rowAttachment}>📎 Ek dosya</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  rowTag: { color: colors.teal, fontSize: 11, fontWeight: "700", flexShrink: 1 },
  rowDate: { color: colors.muted, fontSize: 11 },
  rowTitle: { color: colors.yellow, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  rowTopInline: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4,
  },
  rowTitleInline: { color: colors.yellow, fontSize: 20, fontWeight: "700", flex: 1, marginRight: spacing.sm },
  rowBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  rowAttachment: { color: colors.teal, fontSize: 11, fontWeight: "600", marginTop: 4 },
});
