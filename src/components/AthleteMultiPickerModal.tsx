import React, { useEffect, useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";

export default function AthleteMultiPickerModal({
  visible,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  onConfirm: (athletes: Athlete[]) => void;
  onClose: () => void;
}) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setChecked(new Set());
    setQuery("");
    setLoading(true);
    listAllAthletes()
      .then(setAthletes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [visible]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(athletes.filter((a) => checked.has(a.id)));
    onClose();
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? athletes.filter((a) => a.full_name.toLowerCase().includes(q)) : athletes;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Sporcu Seç</Text>
          <Text style={styles.subtitle}>{checked.size} sporcu seçili</Text>

          <TextInput
            style={styles.search}
            placeholder="Sporcu ara..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
          />

          {loading && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
          {error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            data={filtered}
            keyExtractor={(a) => a.id}
            ListEmptyComponent={!loading ? <Text style={styles.empty}>Sporcu bulunamadı.</Text> : null}
            renderItem={({ item }) => {
              const isChecked = checked.has(item.id);
              return (
                <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{item.full_name}</Text>
                    {!!item.groups?.name && <Text style={styles.rowSub}>{item.groups.name}</Text>}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Ekle ({checked.size})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "80%",
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.sm },
  search: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.sm,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginVertical: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  checkmark: { color: colors.bg, fontWeight: "800", fontSize: 13 },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  footer: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  cancelButton: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center",
  },
  cancelButtonText: { color: colors.muted, fontWeight: "700" },
  confirmButton: { flex: 1, backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  confirmButtonText: { color: colors.bg, fontWeight: "700" },
});
