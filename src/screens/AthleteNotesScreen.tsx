import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAthleteNotes, createAthleteNote, type AthleteNote } from "../lib/api/athleteNotes";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteNotes">;

export default function AthleteNotesScreen({ route }: Props) {
  const { athleteId, athleteName } = route.params;
  const headerHeight = useHeaderHeight();

  const [notes, setNotes] = useState<AthleteNote[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleAdd iki kez çalışıp aynı notu iki kez
  // ekleyebiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setNotes(await listAthleteNotes(athleteId));
    } catch (e: any) {
      setError(e.message ?? "Notlar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [athleteId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (savingRef.current) return;
    if (!text.trim()) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createAthleteNote(athleteId, text.trim());
      setText("");
      load();
    } catch (e: any) {
      setError(e.message ?? "Not eklenemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{athleteName}</Text>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz not eklenmemiş.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.noteRow}>
            <Text style={styles.noteText}>{item.note}</Text>
            <Text style={styles.noteDate}>{new Date(item.created_at).toLocaleDateString("tr-TR")}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Yeni not yaz..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.addButtonText}>Ekle</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  noteRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  noteText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  noteDate: { color: colors.muted, fontSize: 11, marginTop: 6 },
  inputRow: {
    flexDirection: "row", gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.line, alignItems: "flex-end",
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 10,
    maxHeight: 100,
  },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12 },
  addButtonText: { color: colors.bg, fontWeight: "700" },
});
