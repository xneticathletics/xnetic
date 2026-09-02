import React from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export default function RpeDropdown({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: number | null;
  onSelect: (value: number) => void;
  onClose: () => void;
}) {
  const values = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Algılanan Zorluk Derecesi</Text>
          <Text style={styles.subtitle}>Bu antrenman sana ne kadar zor geldi? (1 = çok kolay, 10 = çok zor)</Text>

          <FlatList
            data={values}
            keyExtractor={(v) => String(v)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, item === selected && styles.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.rowText, item === selected && styles.rowTextSelected]}>{item}</Text>
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
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.md },
  row: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm, alignItems: "center",
  },
  rowSelected: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  rowTextSelected: { color: colors.bg },
  closeButton: { alignItems: "center", paddingVertical: spacing.md },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
