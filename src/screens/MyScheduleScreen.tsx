import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyAthletes } from "../lib/api/myAthletes";
import { listSessionsByGroup, type TrainingSession } from "../lib/api/trainingSessions";
import { getAthleteAttendanceStatusMap, type AttendanceStatus } from "../lib/api/attendance";
import { syncScheduleToDeviceCalendar } from "../lib/calendarSync";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";

type Props = NativeStackScreenProps<HomeStackParamList, "MySchedule">;

const ATTENDANCE_LABEL: Record<AttendanceStatus, { text: string; color: string }> = {
  geldi: { text: "Katıldı", color: colors.teal },
  gelmedi: { text: "Katılmadı", color: colors.coral },
  gec_kaldi: { text: "Katılmadı", color: colors.coral },
  raporlu: { text: "Katılmadı", color: colors.coral },
  izinli: { text: "Katılmadı", color: colors.coral },
};

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

export default function MyScheduleScreen({ navigation }: Props) {
  useHomeButton(navigation);

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());

  // Ana Sayfa'ya/bu ekrana her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          const athletes = await getMyAthletes();
          if (athletes.length === 0) {
            if (!cancelled) setError("Bağlı bir sporcu bulunamadı.");
            return;
          }
          const athlete = athletes[0];
          if (!cancelled) {
            setAthleteId(athlete.id);
            setAthleteName(athlete.full_name);
          }
          if (athlete.group_id) {
            const [sessionData, attendanceData] = await Promise.all([
              listSessionsByGroup(athlete.group_id),
              getAthleteAttendanceStatusMap(athlete.id),
            ]);
            if (!cancelled) {
              setSessions(sessionData);
              setAttendanceMap(attendanceData);
            }
          }
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Program yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    for (const s of sessions) {
      (map[s.session_date] ??= []).push(s);
    }
    return map;
  }, [sessions]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedSessions = sessionsByDate[selectedDate] ?? [];

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleCalendarSync = async () => {
    setSyncing(true);
    try {
      const { count, skipped } = await syncScheduleToDeviceCalendar({ sessions });
      const message = `${count} antrenman telefonunun takvimine (X-NETIC takvimi) eklendi.${skipped > 0 ? ` ${skipped} tanesi saat bilgisi hatalı olduğu için atlandı.` : ""}`;
      Alert.alert("Takvime Eklendi", message, [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Takvime eklenemedi", [{ text: "Tamam" }]);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      {!!athleteName && (
        <Text style={styles.subtitle}>{athleteName} · bir antrenmana dokunarak detayını gör</Text>
      )}

      <TouchableOpacity style={styles.syncButton} onPress={handleCalendarSync} disabled={syncing}>
        {syncing ? (
          <ActivityIndicator color={colors.bg} size="small" />
        ) : (
          <Text style={styles.syncButtonText}>📅 Takvimime Ekle</Text>
        )}
      </TouchableOpacity>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

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
          const hasSessions = !!sessionsByDate[dateKey]?.length;
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey();

          return (
            <TouchableOpacity key={idx} style={styles.dayCell} onPress={() => setSelectedDate(dateKey)}>
              <View
                style={[
                  styles.dayCircle,
                  hasSessions && styles.dayCircleHasSession,
                  isSelected && styles.dayCircleSelected,
                  isToday && !isSelected && styles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    hasSessions && styles.dayNumberHasSession,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateLabel}>{selectedDate}</Text>
      </View>

      <FlatList
        data={selectedSessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>Bu gün antrenman yok.</Text> : null}
        renderItem={({ item }) => {
          const attendance = attendanceMap[item.id];
          const attendanceInfo = attendance ? ATTENDANCE_LABEL[attendance] : null;

          const content = (
            <>
              <View style={styles.rowTop}>
                <Text style={styles.rowTime}>{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}</Text>
                {attendanceInfo && (
                  <Text style={[styles.attendanceBadge, { color: attendanceInfo.color }]}>{attendanceInfo.text}</Text>
                )}
              </View>
              <Text style={styles.rowVenue}>{item.venues?.name ?? "Salon atanmadı"}</Text>
            </>
          );

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                athleteId &&
                navigation.navigate("MySessionDetail", { sessionId: item.id, athleteId, athleteName: athleteName ?? "Sporcu" })
              }
            >
              {content}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  syncButton: {
    backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 12,
    alignItems: "center", marginTop: spacing.sm,
  },
  syncButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  error: { color: colors.coral, marginTop: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.sm, marginBottom: spacing.sm },
  monthNavButton: { paddingHorizontal: spacing.lg, paddingVertical: 4 },
  monthNavIcon: { color: colors.yellow, fontSize: 22, fontWeight: "700" },
  monthLabel: { color: colors.ink, fontSize: 16, fontWeight: "700", minWidth: 150, textAlign: "center" },

  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: { width: `${100 / 7}%`, textAlign: "center", color: colors.muted, fontSize: 11, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, alignItems: "center", justifyContent: "center", paddingVertical: 3 },
  dayCircle: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2,
    alignItems: "center", justifyContent: "center",
  },
  dayCircleHasSession: { backgroundColor: colors.yellow },
  dayCircleToday: { borderWidth: 1, borderColor: colors.muted },
  dayCircleSelected: { backgroundColor: colors.teal },
  dayNumber: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  dayNumberHasSession: { color: colors.bg, fontWeight: "800" },
  dayNumberSelected: { color: colors.bg, fontWeight: "800" },

  selectedDateHeader: {
    marginTop: spacing.md, marginBottom: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm,
  },
  selectedDateLabel: { color: colors.ink, fontSize: 14, fontWeight: "700" },

  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  rowTime: { color: colors.teal, fontWeight: "700", fontSize: 14 },
  rowVenue: { color: colors.muted, fontSize: 12 },
  attendanceBadge: { fontSize: 12, fontWeight: "700" },
});
