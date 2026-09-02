import React, { useEffect, useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";

export default function GroupMultiPickerModal({
  visible,
  selectedIds,
  onConfirm,
  onClose,
  allowedIds,
}: {
  visible: boolean;
  selectedIds: string[];
  onConfirm: (groups: Group[]) => void;
  onClose: () => void;
  // Verilirse, listeyi yalnızca bu id'lerdeki gruplarla sınırlar (ör.
  // duyuru oluştururken önce branş seçilmişse o branşın gruplarıyla).
  allowedIds?: string[];
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setChecked(new Set(selectedIds));
    setLoading(true);
    listGroups()
      .then((all) => setGroups(allowedIds ? all.filter((g) => allowedIds.includes(g.id)) : all))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // selectedIds sadece modal her açıldığında başlangıç durumu olarak
    // okunur — kapanana kadar tekrar senkronize edilmez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, allowedIds]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(groups.filter((g) => checked.has(g.id)));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Grupları Seç</Text>
          <Text style={styles.subtitle}>{checked.size} grup seçili</Text>

          {loading && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
          {error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            data={groups}
            keyExtractor={(g) => g.id}
            ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz grup yok.</Text> : null}
            renderItem={({ item }) => {
              const isChecked = checked.has(item.id);
              return (
                <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowSub}>{item.branch}</Text>
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
              <Text style={styles.confirmButtonText}>Tamam ({checked.size})</Text>
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
    padding: spacing.lg, maxHeight: "75%",
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
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
