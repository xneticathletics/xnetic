import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listMessagesWithUser, sendMessage, markMessagesRead, type Message } from "../lib/api/messages";
import { getCurrentAppUserId } from "../lib/api/currentUser";
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

  useEffect(() => {
    navigation.setOptions({ title: userName });
  }, [userName, navigation]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [me, msgs] = await Promise.all([getCurrentAppUserId(), listMessagesWithUser(userId)]);
      setMyUserId(me);
      setMessages(msgs);
      await markMessagesRead(userId);
      refreshUnreadMessagesCount();
    } catch (e: any) {
      setError(e.message ?? "Mesajlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
      await sendMessage(userId, body);
      setMessages(await listMessagesWithUser(userId));
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
              <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.body}</Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{formatTime(item.sent_at)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Mesaj yaz..."
            placeholderTextColor={colors.muted}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending || !draft.trim()}>
            {sending ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.sendButtonText}>Gönder</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, textAlign: "center", marginTop: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
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
