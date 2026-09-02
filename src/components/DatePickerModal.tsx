import React, { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_LABELS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toDateKey(year: number, month0: number, day: number) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function todayKey() {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildMonthGrid(year: number, month0: number): (number | null)[] {
  const firstWeekday = (new Date(year, month0, 1).getDay() + 6) % 7; // Pzt=0
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const CELL_SIZE = 38;

export default function DatePickerModal({
  visible,
  selectedDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDate: string | null; // "YYYY-AA-GG"
  onSelect: (dateKey: string) => void;
  onClose: () => void;
}) {
  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Tarih Seç</Text>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.monthNavButton}>
              <Text style={styles.monthNavIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTH_LABELS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.monthNavButton}>
              <Text style={styles.monthNavIcon}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((w) => (
              <Text key={w} style={styles.weekdayLabel}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((day, idx) => {
              if (day === null) return <View key={idx} style={styles.dayCell} />;
              const dateKey = toDateKey(viewYear, viewMonth, day);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey();

              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.dayCell}
                  onPress={() => {
                    onSelect(dateKey);
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && !isSelected && styles.dayCircleToday,
                      isSelected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{day}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

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
    padding: spacing.lg,
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  monthNavButton: { paddingHorizontal: spacing.lg, paddingVertical: 4 },
  monthNavIcon: { color: colors.yellow, fontSize: 22, fontWeight: "700" },
  monthLabel: { color: colors.ink, fontSize: 15, fontWeight: "700", minWidth: 140, textAlign: "center" },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: { width: `${100 / 7}%`, textAlign: "center", color: colors.muted, fontSize: 11, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.md },
  dayCell: { width: `${100 / 7}%`, alignItems: "center", justifyContent: "center", paddingVertical: 3 },
  dayCircle: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2,
    alignItems: "center", justifyContent: "center",
  },
  dayCircleToday: { borderWidth: 1, borderColor: colors.muted },
  dayCircleSelected: { backgroundColor: colors.yellow },
  dayNumber: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  dayNumberSelected: { color: colors.bg, fontWeight: "800" },
  closeButton: { alignItems: "center", paddingVertical: spacing.sm },
  closeButtonText: { color: colors.muted, fontWeight: "600" },
});
