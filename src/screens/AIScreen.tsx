import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Animated, Easing,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { findGuideAnswer, getSuggestedQuestions } from "../lib/aiGuideKnowledge";
import { useAuth } from "../context/AuthContext";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Merhaba! Ben X-NETIC AI Asistanı. Şu an uygulamayı nasıl kullanacağın konusunda sana rehberlik edebiliyorum — " +
    "aklına bir şey gelmiyorsa sağ üstteki \"💡 Örnek Sorular\"a dokunabilirsin.\n\n" +
    "Kulübünün kendi verilerine dayalı serbest sorular (ör. \"bu ay kaç sporcu geldi\") yakında eklenecek.",
};

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `m${Date.now()}-${messageCounter}`;
}

// Şimdilik gerçek bir dil modeline bağlı değil — findGuideAnswer ile
// yerel, anahtar kelime tabanlı bir rehber kullanıyor (ücretsiz, anahtar
// gerektirmiyor). API anahtarı eklenince bu fonksiyonun içi bir edge
// function çağrısına dönüşecek, ekranın geri kalanı değişmeyecek.
async function getAssistantReply(question: string): Promise<string> {
  const match = findGuideAnswer(question);
  if (match) {
    return `**${match.title}**\n\n${match.answer}`;
  }
  return (
    "Bu konuda henüz hazır bir rehberim yok. Şu an sadece belirli konularda yardımcı olabiliyorum — " +
    'örneğin "şifre sıfırlama", "yeni sporcu ekleme", "aidat planı oluşturma", "yoklama alma", "maç sonucu girme", ' +
    '"duyuru oluşturma", "takvime ekleme" ya da "mağazaya ürün ekleme".\n\n' +
    "Serbest, her konuda soru-cevap özelliği yakında eklenecek."
  );
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const listRef = useRef<FlatList>(null);

  const suggestedQuestions = useMemo(() => getSuggestedQuestions(role), [role]);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      enterAnim.setValue(0);
      Animated.timing(enterAnim, {
        toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    }, [enterAnim])
  );
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ scale: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
  };

  const submitQuestion = async (question: string) => {
    if (!question || sending) return;
    setDraft("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: question }]);
    setSending(true);
    try {
      const reply = await getAssistantReply(question);
      setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: reply }]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const handleSend = () => submitQuestion(draft.trim());

  const handlePickSuggestion = (question: string) => {
    setSuggestionsVisible(false);
    submitQuestion(question);
  };

  return (
    <Animated.View style={[{ flex: 1 }, enterStyle]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>🤖 AI Asistan</Text>
            <TouchableOpacity style={styles.suggestionsButton} onPress={() => setSuggestionsVisible(true)}>
              <Text style={styles.suggestionsButtonText}>💡 Örnek Sorular</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: spacing.md }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMine = item.role === "user";
              return (
                <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
                  </View>
                </View>
              );
            }}
          />

          {sending && <Text style={styles.typingHint}>AI Asistan yazıyor…</Text>}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Bir şey sor... (ör. şifre nasıl sıfırlanır?)"
              placeholderTextColor={colors.muted}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending || !draft.trim()}>
              <Text style={styles.sendButtonText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={suggestionsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSuggestionsVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>💡 Örnek Sorular</Text>
            <Text style={styles.sheetSubtitle}>Birine dokun, direkt soralım.</Text>
            <ScrollView style={{ marginTop: spacing.sm }} showsVerticalScrollIndicator={false}>
              {suggestedQuestions.map((entry) => (
                <TouchableOpacity
                  key={entry.title}
                  style={styles.suggestionRow}
                  onPress={() => handlePickSuggestion(entry.sampleQuestion)}
                >
                  <Text style={styles.suggestionRowText}>{entry.sampleQuestion}</Text>
                  <Text style={styles.suggestionRowChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSuggestionsVisible(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  suggestionsButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  suggestionsButtonText: { color: colors.yellow, fontWeight: "700", fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "75%",
  },
  sheetTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  sheetSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  suggestionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12,
  },
  suggestionRowText: { color: colors.ink, fontSize: 13.5, flex: 1 },
  suggestionRowChevron: { color: colors.yellow, fontSize: 18, fontWeight: "700" },
  closeButton: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.xs },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
  bubbleRow: { flexDirection: "row", marginBottom: spacing.sm },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "85%", borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.yellow, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: colors.bg },
  typingHint: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: spacing.sm,
    paddingVertical: spacing.sm,
    // Alt menünün ortasındaki taşan logo sekme çubuğunun üstüne sarkıyor —
    // yazı alanının onun altında kalmaması için ekstra boşluk.
    marginBottom: 30,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 10, maxHeight: 100, marginTop: spacing.sm,
  },
  sendButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, marginTop: spacing.sm },
  sendButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
});
