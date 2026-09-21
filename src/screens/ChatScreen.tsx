import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listMessagesWithUser, sendMessage, markMessagesRead, type Message } from "../lib/api/messages";
import { getCurrentAppUserId } from "../lib/api/currentUser";
import { listBlockedIds, blockUser, unblockUser } from "../lib/api/moderation";
import ReportModal from "../components/ReportModal";
import { refreshUnreadMessagesCount } from "../lib/unreadMessagesStore";
import type { MessagesStackParamList } from "../navigation/MessagesStack";

type Props = NativeStackScreenProps<MessagesStackParamList, "Chat">;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen({ route, navigation }: Props) {
  const { userId, userName } = route.params;
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "message" | "user"; contentId?: string; userId: string; userName: string; snapshot?: string } | null>(null);

  const refreshBlocks = useCallback(async () => {
    try {
      const { byMe, me } = await listBlockedIds();
      setBlockedByMe(byMe.has(userId));
      setBlockedMe(me.has(userId));
    } catch {}
  }, [userId]);

  const toggleBlock = useCallback(() => {
    if (blockedByMe) {
      unblockUser(userId).then(refreshBlocks).catch((e: any) => Alert.alert("Hata", e?.message ?? "İşlem yapılamadı"));
      return;
    }
    Alert.alert("Kullanıcıyı engelle", `${userName} engellensin mi? Birbirinize mesaj gönderemezsiniz.`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Engelle", style: "destructive",
        onPress: () => blockUser(userId).then(refreshBlocks).catch((e: any) => Alert.alert("Hata", e?.message ?? "Engellenemedi")),
      },
    ]);
  }, [blockedByMe, userId, userName, refreshBlocks]);

  useEffect(() => {
    navigation.setOptions({
      title: userName,
      headerRight: () => (
        <TouchableOpacity
          accessibilityLabel="Seçenekler"
          onPress={() =>
            Alert.alert(userName, undefined, [
              { text: "Şikayet Et", onPress: () => setReportTarget({ type: "user", userId, userName }) },
              { text: blockedByMe ? "Engeli Kaldır" : "Engelle", style: blockedByMe ? "default" : "destructive", onPress: toggleBlock },
              { text: "Vazgeç", style: "cancel" },
            ])
          }
        >
          <Text style={{ color: colors.ink, fontSize: 22, paddingHorizontal: 8 }}>⋯</Text>
        </TouchableOpacity>
      ),
    });
  }, [userName, userId, navigation, blockedByMe, toggleBlock]);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Üçü de birbirinden bağımsız — sıra sıra beklemek yerine paralel.
      const [me, msgs] = await Promise.all([
        getCurrentAppUserId(),
        listMessagesWithUser(userId),
        markMessagesRead(userId),
      ]);
      setMyUserId(me);
      setMessages(msgs);
      refreshBlocks();
      refreshUnreadMessagesCount();
    } catch (e: any) {
      setError(e.message ?? "Mesajlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [userId, refreshBlocks]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setDraft("");
    setError(null);
    try {
      // Gönderilen mesajı doğrudan listeye ekliyoruz — az önce tekrar
      // indirmemek için TÜM konuşma geçmişini yeniden çekmeye gerek yok,
      // sendMessage zaten eklenen satırı geri döndürüyor.
      const sent = await sendMessage(userId, body);
      setMessages((prev) => [...prev, sent]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      setError(e.message ?? "Gönderilemedi");
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={headerHeight}>
      <View style={styles.container}>
        {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz mesaj yok — ilk mesajı sen gönder.</Text> : null}
          renderItem={({ item }) => {
            const isMine = item.sender_id === myUserId;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                delayLongPress={400}
                onLongPress={() => {
                  if (isMine) return;
                  Alert.alert("Mesaj", undefined, [
                    { text: "Şikayet Et", onPress: () => setReportTarget({ type: "message", contentId: item.id, userId, userName, snapshot: item.body }) },
                    { text: "Vazgeç", style: "cancel" },
                  ]);
                }}
                style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
                accessibilityLabel={`${isMine ? "Sen" : "Karşı taraf"}, saat ${formatTime(item.sent_at)}: ${item.body}`}
              >
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.body}</Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{formatTime(item.sent_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {(blockedByMe || blockedMe) ? (
          <Text style={styles.blockedNotice}>
            {blockedByMe ? "Bu kişiyi engelledin. Mesaj göndermek için sağ üstten engeli kaldır." : "Bu kişiye mesaj gönderemezsin."}
          </Text>
        ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Mesaj yaz..."
            placeholderTextColor={colors.muted}
            multiline
            accessibilityLabel="Mesaj yaz"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending || !draft.trim()}>
            {sending ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.sendButtonText}>Gönder</Text>}
          </TouchableOpacity>
        </View>
        )}
        <ReportModal visible={!!reportTarget} target={reportTarget} onClose={() => setReportTarget(null)} onBlocked={refreshBlocks} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, textAlign: "center", marginTop: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  // Yazı alanının yerine geçtiği için aynı alt boşluğa ihtiyacı var —
  // aksi halde alt menünün ortasındaki taşan logonun altında kalıp
  // okunamıyor (inputRow'daki marginBottom ile aynı gerekçe).
  blockedNotice: {
    color: colors.muted, textAlign: "center", fontSize: 13,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: 30,
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg,
  },
  bubbleRow: { flexDirection: "row", marginBottom: spacing.sm },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.yellow, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.ink, fontSize: 14 },
  bubbleTextMine: { color: colors.bg },
  bubbleTime: { color: colors.muted, fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  bubbleTimeMine: { color: `${colors.bg}99` },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    // Alt menünün ortasındaki taşan logo, sekme çubuğunun üstüne doğru
    // biraz sarkıyor — bu boşluk, yazı yazma alanının onun altında
    // kalmaması için ekstra yukarı boşluk bırakıyor.
    marginBottom: 30,
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 10, maxHeight: 100,
  },
  sendButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12 },
  sendButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
});
