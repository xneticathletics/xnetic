import React, { useEffect, useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";

export default function GroupPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
  allowedIds,
}: {
  visible: boolean;
  selectedId: string | null;
  onSelect: (group: Group) => void;
  onClose: () => void;
  // Verilirse, listeyi yalnızca bu id'lerdeki gruplarla sınırlar (ör.
  // antrenörün yalnızca kendi gruplarını görmesi için).
  allowedIds?: string[];
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listGroups()
      .then((all) => setGroups(allowedIds ? all.filter((g) => allowedIds.includes(g.id)) : all))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [visible, allowedIds]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Grup Seç</Text>

          {loading && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
          {error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            data={groups}
            keyExtractor={(g) => g.id}
            ListEmptyComponent={
              !loading ? <Text style={styles.empty}>Henüz grup tanımlanmamış.</Text> : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, item.id === selectedId && styles.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.rowText}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.branch}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "70%",
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginVertical: spacing.lg },
  row: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowSelected: { borderColor: colors.yellow },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12 },
  closeButton: { alignItems: "center", paddingVertical: spacing.md },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
