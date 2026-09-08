import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { AttendanceStatus } from "../lib/api/attendance";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "MyDayScheduleDetail">;

const ATTENDANCE_LABEL: Record<AttendanceStatus, { text: string; color: string }> = {
  geldi: { text: "Katıldı", color: colors.teal },
  gelmedi: { text: "Katılmadı", color: colors.coral },
  gec_kaldi: { text: "Katılmadı", color: colors.coral },
  raporlu: { text: "Katılmadı", color: colors.coral },
  izinli: { text: "Katılmadı", color: colors.coral },
};

// MyScheduleScreen'de ZATEN seçili olan bir güne ikinci kez dokununca açılır
// — o günün antrenman(lar)ını tam ekran gösterir. Antrenör/admin tarafındaki
// DayScheduleDetailScreen'in veli/sporcu karşılığı (aksiyon butonları yok,
// sadece görüntüleme + MySessionDetail'e geçiş).
export default function MyDayScheduleDetailScreen({ route, navigation }: Props) {
  const { date, sessions, attendanceMap, athleteId, athleteName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{date}</Text>
      <Text style={styles.countLabel}>{sessions.length > 0 ? `${sessions.length} antrenman` : "Antrenman yok"}</Text>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={styles.empty}>Bu gün antrenman yok.</Text>}
        renderItem={({ item }) => {
          const attendance = attendanceMap[item.id];
          const attendanceInfo = attendance ? ATTENDANCE_LABEL[attendance] : null;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("MySessionDetail", { sessionId: item.id, athleteId, athleteName })}
            >
              <View style={styles.rowTop}>
                <Text style={styles.rowTime}>{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}</Text>
                {attendanceInfo && (
                  <Text style={[styles.attendanceBadge, { color: attendanceInfo.color }]}>{attendanceInfo.text}</Text>
                )}
              </View>
              <Text style={styles.rowVenue}>{item.venues?.name ?? "Salon atanmadı"}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  dateLabel: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  countLabel: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  rowTime: { color: colors.teal, fontWeight: "700", fontSize: 14 },
  rowVenue: { color: colors.muted, fontSize: 12 },
  attendanceBadge: { fontSize: 12, fontWeight: "700" },
});
