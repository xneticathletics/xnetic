import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator, Image, Linking, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listMyNotifications, getMyUnreadNotificationCount, markAllNotificationsRead,
  type AppNotification,
} from "../lib/api/notifications";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "heic"];

// AnnouncementDetailScreen.tsx'teki AnnouncementAttachment ile aynı desen —
// görselse doğrudan gösterir, değilse cihazın kendi uygulamasında açması
// için bir buton gösterir.
function NotificationAttachment({ url }: { url: string }) {
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

// Ana Sayfa'nın sağ üstünde duran zil — dokununca açılır bir pencere
// gösterir, hiçbir sayfaya yönlendirme yapmaz. Kapatınca (X ya da
// dışarı dokunarak) sadece pencere kapanır.
export default function NotificationBell() {
  const [visible, setVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getMyUnreadNotificationCount().then(setUnreadCount).catch(() => {});
    }, [])
  );

  const openModal = async () => {
    setVisible(true);
    setLoading(true);
    try {
      const list = await listMyNotifications();
      setNotifications(list);
      if (unreadCount > 0) {
        await markAllNotificationsRead();
        setUnreadCount(0);
      }
    } catch {
      // sessizce yut — bildirimler kritik bir özellik değil
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <TouchableOpacity style={styles.bellButton} onPress={openModal}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Bildirimler</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.xl }} />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(n) => n.id}
                style={{ maxHeight: 420 }}
                ListEmptyComponent={<Text style={styles.empty}>Henüz bildirim yok.</Text>}
                renderItem={({ item }) => (
                  <View style={styles.notifRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    {!!item.payload?.attachmentUrl && <NotificationAttachment url={item.payload.attachmentUrl} />}
                    <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
                  </View>
                )}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: { padding: 6, position: "relative" },
  bellIcon: { fontSize: 22 },
  badge: {
    position: "absolute", top: 0, right: 0, backgroundColor: colors.coral,
    borderRadius: radius.full, minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-start", alignItems: "stretch" },
  sheet: {
    backgroundColor: colors.surface, marginTop: 70, marginHorizontal: spacing.lg,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sheetTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  closeText: { color: colors.yellow, fontWeight: "700", fontSize: 13 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: spacing.lg },
  notifRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: spacing.sm },
  notifTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  notifBody: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  notifDate: { color: colors.muted, fontSize: 10, marginTop: 4 },
  attachmentImage: { width: "100%", height: 140, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.bg },
  attachmentButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm, paddingVertical: 8, alignItems: "center", marginTop: spacing.sm },
  attachmentButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
});
