import React, { useEffect, useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { listBranches, type Branch } from "../lib/api/branches";

export default function BranchPickerModal({
  visible,
  selectedName,
  onSelect,
  onClose,
  allowedNames,
}: {
  visible: boolean;
  selectedName: string | null;
  onSelect: (branch: Branch) => void;
  onClose: () => void;
  // Verilirse, listeyi yalnızca bu isimlerdeki branşlarla sınırlar (ör.
  // bir antrenörün/koordinatörün yalnızca kendi branşını görmesi için).
  allowedNames?: string[];
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listBranches()
      .then((all) => setBranches(allowedNames ? all.filter((b) => allowedNames.includes(b.name)) : all))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [visible, allowedNames]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Branş Seç</Text>

          {loading && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.lg }} />}
          {error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            data={branches}
            keyExtractor={(b) => b.id}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.empty}>
                  Henüz branş eklenmemiş. Kulüp Ayarları → Branşlar'dan ekleyebilirsin.
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, item.name === selectedName && styles.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.rowText}>{item.name}</Text>
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
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "70%",
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginVertical: spacing.lg },
  row: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.yellow },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  closeButton: { alignItems: "center", paddingVertical: spacing.md },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
