import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator, Image, Linking, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listMyNotifications, getMyUnreadNotificationCount, markAllNotificationsRead,
  type AppNotification,
} from "../lib/api/notifications";
import { getNotificationTarget } from "../lib/notificationNavigation";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

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
// gösterir. Bir bildirime dokununca (event_type'a göre) ilgili ekrana
// yönlendirir; hangi ekranın "ilgili" olduğu getNotificationTarget'ta
// merkezi olarak tanımlı (push bildirimine dokunma — bkz.
// NotificationResponseHandler.tsx — aynı haritayı paylaşır).
export default function NotificationBell({
  navigation,
}: {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
}) {
  const { role } = useAuth();
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

  const handlePressNotification = (n: AppNotification) => {
    if (!role) return;
    const target = getNotificationTarget(n.event_type, n.payload, role);
    if (!target) return;
    setVisible(false);
    if (target.tab === "Ana Menü") {
      navigation.navigate(target.screen as any, target.params as any);
    } else {
      (navigation.getParent()?.navigate as any)(target.tab, { screen: target.screen, params: target.params });
    }
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
                renderItem={({ item }) => {
                  const target = role ? getNotificationTarget(item.event_type, item.payload, role) : null;
                  const Wrapper = target ? TouchableOpacity : View;
                  return (
                    <Wrapper style={styles.notifRow} onPress={target ? () => handlePressNotification(item) : undefined}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        {!!target && <Text style={styles.notifChevron}>›</Text>}
                      </View>
                      <Text style={styles.notifBody}>{item.body}</Text>
                      {!!item.payload?.attachmentUrl && <NotificationAttachment url={item.payload.attachmentUrl} />}
                      <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
                    </Wrapper>
                  );
                }}
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
  notifTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notifTitle: { color: colors.ink, fontSize: 13, fontWeight: "700", flex: 1 },
  notifChevron: { color: colors.yellow, fontSize: 16, fontWeight: "700", marginLeft: spacing.sm },
  notifBody: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  notifDate: { color: colors.muted, fontSize: 10, marginTop: 4 },
  attachmentImage: { width: "100%", height: 140, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.bg },
  attachmentButton: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm, paddingVertical: 8, alignItems: "center", marginTop: spacing.sm },
  attachmentButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
});
