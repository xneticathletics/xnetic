import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export type SetEntry = { weight: string; reps: string };

type Props = {
  value: SetEntry[];
  onChange: (next: SetEntry[]) => void;
  onFocus?: (e: any) => void;
};

// Bir hareketin antrenman sırasında/sonrasında girilen set-bazlı
// ağırlık+tekrar kayıtları — FitnessProgramDetailScreen (atanmış program)
// ve IndividualFitnessProgramDetailScreen (bireysel program) arasında
// paylaşılan tek bir bileşen, ikisi de aynı "her sette kaç kilo kaç
// tekrar" girişini kullanıyor.
export default function SetEntryList({ value, onChange, onFocus }: Props) {
  const updateRow = (index: number, patch: Partial<SetEntry>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
  const addRow = () => {
    onChange([...value, { weight: "", reps: "" }]);
  };

  return (
    <View>
      {value.map((row, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.setLabel}>{index + 1}.</Text>
          <TextInput
            onFocus={onFocus}
            style={[styles.input, styles.inputWeight]}
            value={row.weight}
            onChangeText={(t) => updateRow(index, { weight: t })}
            keyboardType="numeric"
            placeholder="kg"
            placeholderTextColor={colors.muted}
            accessibilityLabel={`${index + 1}. set ağırlık (kg)`}
          />
          <TextInput
            onFocus={onFocus}
            style={[styles.input, styles.inputReps]}
            value={row.reps}
            onChangeText={(t) => updateRow(index, { reps: t })}
            keyboardType="numeric"
            placeholder="tekrar"
            placeholderTextColor={colors.muted}
            accessibilityLabel={`${index + 1}. set tekrar sayısı`}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeRow(index)}
            accessibilityLabel={`${index + 1}. seti kaldır`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addRow}>
        <Text style={styles.addButtonText}>+ Set Ekle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs },
  setLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", width: 16 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    color: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: 13,
  },
  inputWeight: { flex: 1 },
  inputReps: { flex: 1 },
  removeButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  removeButtonText: { color: colors.coral, fontSize: 14, fontWeight: "700" },
  addButton: {
    borderWidth: 1, borderColor: colors.violet, borderStyle: "dashed", borderRadius: radius.sm,
    paddingVertical: 8, alignItems: "center", marginTop: 2, marginBottom: spacing.sm,
  },
  addButtonText: { color: colors.violet, fontSize: 12, fontWeight: "700" },
});
