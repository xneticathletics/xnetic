import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Animated, Easing,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import { MANUAL_MODULES, SAMPLE_QUESTIONS, type ManualEntry } from "../lib/assistantManualData";
import { audiencesFor, entriesFor, searchManual } from "../lib/assistantSearch";

// Asistan = uygulamanın kullanma kılavuzu. Bilgi tabanı assistantManualData.ts
// (scripts/manual/*.js'ten otomatik üretilir), arama motoru assistantSearch.ts.
// Gerçek bir dil modeli DEĞİL: cevaplar kılavuzdan gelir, uydurma yapmaz.

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  title?: string;
  // Cevabın altındaki "şunu mu demek istedin?" düğmeleri.
  suggestions?: ManualEntry[];
};

const ROLE_LABEL: Record<string, string> = {
  A: "Kulüp Yöneticisi", K: "Branş Koordinatörü", C: "Antrenör", P: "Veli", S: "Sporcu", X: "Süper Admin",
};

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `m${Date.now()}-${messageCounter}`;
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const { isLocked } = useBranchSelect();
  const isCoordinator = role === "coach" && isLocked;

  const audiences = useMemo(() => audiencesFor(role, isCoordinator), [role, isCoordinator]);
  const primary = audiences[0];
  const visibleEntries = useMemo(() => entriesFor(audiences), [audiences]);
  const samples = useMemo(() => (primary ? SAMPLE_QUESTIONS[primary] : []), [primary]);

  const welcome = useMemo<ChatMessage>(
    () => ({
      id: "welcome",
      role: "assistant",
      title: "Merhaba, ben X-NETIC Asistanı 👋",
      text:
        `Uygulamanın kullanma kılavuzuyum${primary ? ` — şu an ${ROLE_LABEL[primary]} olarak görüyorsun` : ""}. ` +
        "Uygulamadaki her özelliğin nasıl kullanıldığını adım adım anlatırım.\n\n" +
        "• Kendi cümlenle sor: \"yoklama nasıl alınır?\"\n" +
        "• Sağ üstteki 💡 Örnek Sorular'dan birini seç\n" +
        "• 📖 Kılavuz'dan başlıkları tek tek gez\n\n" +
        "Not: Gerçek bir yapay zeka değilim; kulübünün verilerini (ör. \"bu ay kaç sporcu geldi\") okuyup yorumlayamam.",
    }),
    [primary]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const allMessages = useMemo(() => [welcome, ...messages], [welcome, messages]);
  const [draft, setDraft] = useState("");
  const [samplesVisible, setSamplesVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

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

  const scrollToEndSoon = () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

  const pushMessages = (...next: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...next]);
    scrollToEndSoon();
  };

  const answerFromEntry = (entry: ManualEntry, extra?: Partial<ChatMessage>): ChatMessage => ({
    id: nextId(), role: "assistant", title: entry.title, text: entry.answer, ...extra,
  });

  const submitQuestion = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setDraft("");
    const userMsg: ChatMessage = { id: nextId(), role: "user", text: q };

    const res = searchManual(q, audiences);
    if (!res.best) {
      pushMessages(userMsg, {
        id: nextId(), role: "assistant",
        title: "Bunu kılavuzda bulamadım",
        text:
          "Sorunu tam anlayamadım. Şunları deneyebilirsin:\n" +
          "• Soruyu daha kısa ve anahtar kelimelerle yaz (ör. \"aidat planı\", \"yoklama\", \"şifre\")\n" +
          "• 📖 Kılavuz'dan konu başlıklarına göz at\n" +
          "• 💡 Örnek Sorular'dan birini seç\n\n" +
          "Hâlâ çözemezsen Profil → Yardım / Destek'ten bize yazabilirsin.",
      });
      return;
    }

    const lead = res.confident ? "" : "Sorunu tam anlayamadım; en yakın başlığı gösteriyorum. Aradığın bu değilse aşağıdakilerden birini seç.\n\n";
    pushMessages(userMsg, {
      id: nextId(), role: "assistant", title: res.best.title, text: lead + res.best.answer,
      suggestions: res.suggestions.length ? res.suggestions : undefined,
    });
  };

  // Bir öneri düğmesine / kılavuz başlığına dokununca: başlık kullanıcı sorusu
  // gibi eklenir ve kılavuz cevabı doğrudan gösterilir.
  const openEntry = (entry: ManualEntry) => {
    pushMessages({ id: nextId(), role: "user", text: entry.title }, answerFromEntry(entry));
  };

  const handleSend = () => submitQuestion(draft);

  const modulesWithCounts = useMemo(
    () =>
      MANUAL_MODULES.map((m) => ({ ...m, items: visibleEntries.filter((e) => e.module === m.key) })).filter((m) => m.items.length > 0),
    [visibleEntries]
  );
  const activeModule = modulesWithCounts.find((m) => m.key === openModule) ?? null;

  const closeManual = () => { setManualVisible(false); setOpenModule(null); };

  return (
    <Animated.View style={[{ flex: 1 }, enterStyle]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>🤖 Asistan</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.pillButton} onPress={() => setManualVisible(true)}>
                <Text style={styles.pillButtonText}>📖 Kılavuz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pillButton} onPress={() => setSamplesVisible(true)}>
                <Text style={styles.pillButtonText}>💡 Örnek Sorular</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={(m) => m.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: spacing.md }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isMine = item.role === "user";
              return (
                <View>
                  <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      {!!item.title && <Text style={styles.bubbleTitle}>{item.title}</Text>}
                      <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
                    </View>
                  </View>
                  {!!item.suggestions && (
                    <View style={styles.chipsWrap}>
                      <Text style={styles.chipsLabel}>Şunu mu demek istedin?</Text>
                      {item.suggestions.map((s: ManualEntry) => (
                        <TouchableOpacity key={s.id} style={styles.chip} onPress={() => openEntry(s)}>
                          <Text style={styles.chipText} numberOfLines={2}>{s.title}</Text>
                          <Text style={styles.chipChevron}>›</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Bir şey sor... (ör. yoklama nasıl alınır?)"
              placeholderTextColor={colors.muted}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!draft.trim()}>
              <Text style={styles.sendButtonText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 💡 Örnek Sorular — her rol için 20 soru */}
      <Modal visible={samplesVisible} animationType="slide" transparent onRequestClose={() => setSamplesVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>💡 Örnek Sorular</Text>
            <Text style={styles.sheetSubtitle}>Birine dokun, direkt soralım.</Text>
            <ScrollView style={{ marginTop: spacing.sm }} showsVerticalScrollIndicator={false}>
              {samples.map((s) => (
                <TouchableOpacity
                  key={s.id + s.q}
                  style={styles.row}
                  onPress={() => { setSamplesVisible(false); submitQuestion(s.q); }}
                >
                  <Text style={styles.rowText}>{s.q}</Text>
                  <Text style={styles.rowChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSamplesVisible(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📖 Kılavuz — konu başlıkları → başlıklar */}
      <Modal visible={manualVisible} animationType="slide" transparent onRequestClose={closeManual}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {activeModule ? (
              <>
                <TouchableOpacity onPress={() => setOpenModule(null)}>
                  <Text style={styles.backLink}>‹ Tüm Konular</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{activeModule.icon} {activeModule.title}</Text>
                <Text style={styles.sheetSubtitle}>{activeModule.items.length} başlık — dokununca cevabı gelir.</Text>
                <ScrollView style={{ marginTop: spacing.sm }} showsVerticalScrollIndicator={false}>
                  {activeModule.items.map((e) => (
                    <TouchableOpacity key={e.id} style={styles.row} onPress={() => { closeManual(); openEntry(e); }}>
                      <Text style={styles.rowText}>{e.title}</Text>
                      <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>📖 Kullanma Kılavuzu</Text>
                <Text style={styles.sheetSubtitle}>
                  {primary ? `${ROLE_LABEL[primary]} için` : ""} {visibleEntries.length} başlık, {modulesWithCounts.length} konu.
                </Text>
                <ScrollView style={{ marginTop: spacing.sm }} showsVerticalScrollIndicator={false}>
                  {modulesWithCounts.map((m) => (
                    <TouchableOpacity key={m.key} style={styles.row} onPress={() => setOpenModule(m.key)}>
                      <Text style={styles.rowText}>{m.icon}  {m.title}</Text>
                      <Text style={styles.rowCount}>{m.items.length}</Text>
                      <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeManual}>
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
  headerRow: { marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  headerButtons: { flexDirection: "row", gap: spacing.sm },
  pillButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  pillButtonText: { color: colors.yellow, fontWeight: "700", fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "80%",
  },
  sheetTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  sheetSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  backLink: { color: colors.yellow, fontSize: 13, fontWeight: "700", marginBottom: spacing.xs },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12,
  },
  rowText: { color: colors.ink, fontSize: 13.5, flex: 1 },
  rowCount: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  rowChevron: { color: colors.yellow, fontSize: 18, fontWeight: "700" },
  closeButton: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.xs },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
  bubbleRow: { flexDirection: "row", marginBottom: spacing.sm },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "88%", borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.yellow, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  bubbleTitle: { color: colors.yellow, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  bubbleText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: colors.bg },
  chipsWrap: { marginBottom: spacing.sm, marginLeft: 2, gap: 6 },
  chipsLabel: { color: colors.muted, fontSize: 11.5, fontWeight: "700", marginBottom: 2 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, alignSelf: "flex-start", maxWidth: "88%",
    borderWidth: 1, borderColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: colors.yellowSoft,
  },
  chipText: { color: colors.yellow, fontSize: 12.5, fontWeight: "700", flexShrink: 1 },
  chipChevron: { color: colors.yellow, fontSize: 16, fontWeight: "700" },
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
