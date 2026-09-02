import React, { useCallback, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listConversations, type Conversation } from "../lib/api/messages";
import { refreshUnreadMessagesCount } from "../lib/unreadMessagesStore";
import type { UserRole } from "../context/AuthContext";
import type { MessagesStackParamList } from "../navigation/MessagesStack";

type Props = NativeStackScreenProps<MessagesStackParamList, "MessagesList"> & { role: UserRole };

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("tr-TR");
}

export default function MessagesListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setConversations(await listConversations());
    } catch (e: any) {
      setError(e.message ?? "Mesajlar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
      refreshUnreadMessagesCount();
    }, [load])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesajlar</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("NewMessage")}>
          <Text style={styles.addButtonText}>+ Yeni Mesaj</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.contact.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Henüz mesajın yok. "+ Yeni Mesaj" ile başla.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Chat", { userId: item.contact.id, userName: item.contact.name })}
          >
            {item.contact.photo_url ? (
              <Image source={{ uri: item.contact.photo_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.contact.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.contact.name}</Text>
              <Text style={[styles.rowSnippet, item.unreadCount > 0 && styles.rowSnippetUnread]} numberOfLines={1}>
                {item.lastMessage.body}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={styles.rowTime}>{formatTime(item.lastMessage.sent_at)}</Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSnippet: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowSnippetUnread: { color: colors.ink, fontWeight: "600" },
  rowTime: { color: colors.muted, fontSize: 11 },
  unreadBadge: {
    backgroundColor: colors.yellow, borderRadius: radius.full, minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 5,
  },
  unreadBadgeText: { color: colors.bg, fontSize: 10, fontWeight: "800" },
});
