import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";

export default function AthletePickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedId: string | null;
  onSelect: (athlete: Athlete) => void;
  onClose: () => void;
}) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listAllAthletes()
      .then(setAthletes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = athletes.filter((a) => a.full_name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Sporcu Seç</Text>
            <TextInput
              style={styles.search}
              placeholder="Ara..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />

            {loading && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
            {error && <Text style={styles.error}>{error}</Text>}

            <FlatList
              data={filtered}
              keyExtractor={(a) => a.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={!loading ? <Text style={styles.empty}>Sporcu bulunamadı.</Text> : null}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, item.id === selectedId && styles.rowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.rowText}>{item.full_name}</Text>
                  <Text style={styles.rowSub}>{item.groups?.name ?? "Grup atanmadı"}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "75%",
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  search: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginVertical: spacing.lg },
  row: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  rowSelected: { borderColor: colors.yellow },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12 },
  closeButton: { alignItems: "center", paddingVertical: spacing.md },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
