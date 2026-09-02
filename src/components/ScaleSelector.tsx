import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

// 1-5 arası bir değeri seçmek için kullanılan basit kutucuk seçici —
// Wellness Check-in'deki (uyku kalitesi, enerji vb.) alanlar için.
export default function ScaleSelector({
  value,
  onChange,
  lowLabel,
  highLabel,
  activeColor = colors.teal,
}: {
  value: number | null;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
  activeColor?: string;
}) {
  return (
    <View>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
              onPress={() => onChange(n)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {(lowLabel || highLabel) && (
        <View style={styles.labelsRow}>
          <Text style={styles.labelText}>{lowLabel}</Text>
          <Text style={styles.labelText}>{highLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  chip: {
    flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.bg,
  },
  chipText: { color: colors.muted, fontWeight: "700", fontSize: 14 },
  chipTextActive: { color: colors.bg },
  labelsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  labelText: { color: colors.muted, fontSize: 10 },
});
