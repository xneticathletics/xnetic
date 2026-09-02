import React from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import type { Coach } from "../lib/api/coaches";

export default function CoachPickerModal({
  visible,
  title,
  coaches,
  excludeIds,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  coaches: Coach[];
  // Bu grupta zaten başka bir slotta (ör. Baş Antrenör iken Yardımcı
  // listesinde tekrar) görünmesin diye hariç tutulacak antrenörler.
  excludeIds?: string[];
  onSelect: (coachId: string | null) => void;
  onClose: () => void;
}) {
  const visibleCoaches = excludeIds ? coaches.filter((c) => !excludeIds.includes(c.id)) : coaches;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <FlatList
            data={visibleCoaches}
            keyExtractor={(c) => c.id}
            ListHeaderComponent={
              <TouchableOpacity style={styles.row} onPress={() => { onSelect(null); onClose(); }}>
                <Text style={styles.rowTextMuted}>Yok (Boşalt)</Text>
              </TouchableOpacity>
            }
            ListEmptyComponent={<Text style={styles.empty}>Uygun antrenör yok.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => { onSelect(item.id); onClose(); }}>
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
  empty: { color: colors.muted, textAlign: "center", marginVertical: spacing.lg },
  row: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm,
  },
  rowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowTextMuted: { color: colors.coral, fontSize: 14, fontWeight: "600" },
  closeButton: { alignItems: "center", paddingVertical: spacing.sm },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
