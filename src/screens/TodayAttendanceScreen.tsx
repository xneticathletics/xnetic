import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listSessions, listSessionsForGroups, isAttendanceWindowOpen, isSessionPast, type TrainingSession } from "../lib/api/trainingSessions";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useAuth } from "../context/AuthContext";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "TodayAttendance">;

function todayKey() {
  const d = new Date();
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Antrenör "Yoklama Al" kutucuğuna basınca doğrudan buraya gelir — takvim
// yok, sadece BUGÜN antrenmanı olan gruplar listelenir, birine dokunup
// direkt yoklama ekranına geçilir.
export default function TodayAttendanceScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { settings } = useClubSettings();
  const isCoach = role === "coach";

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = isCoach
        ? await listSessionsForGroups(await getMyCoachedGroupIds())
        : await listSessions();
      setSessions(all.filter((s) => s.session_date === todayKey()));
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [isCoach]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Bugün antrenmanı olan gruplar</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AttendanceHistory")}>
          <Text style={styles.historyLink}>📅 Geçmiş Antrenmanlar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bugün için planlanmış antrenman yok.</Text> : null}
        renderItem={({ item }) => {
          // Admin istisnası kaldırıldı — geçmiş bir antrenmanın yoklaması
          // artık hiç kimse tarafından değiştirilemez (kullanıcı kararı,
          // 2026-09-26). Bugün içinde ERKEN saatte olup penceresi çoktan
          // kapanmış bir antrenman için ekrana yine de GİRİLEBİLİR — artık
          // salt önizleme (AttendanceScreen kendi içinde düzenlemeyi
          // engelliyor); sadece henüz BAŞLAMAMIŞ bir antrenmanda giriş
          // engelleniyor, önizlenecek bir şey yok.
          const attendanceOpen = isAttendanceWindowOpen(
            item, settings.attendance_window_before_minutes, settings.attendance_window_after_minutes
          );
          const past = isSessionPast(item);
          return (
            <TouchableOpacity
              style={[styles.row, !attendanceOpen && !past && styles.rowDisabled]}
              onPress={() => {
                if (!attendanceOpen && !past) {
                  Alert.alert(
                    "Henüz zamanı değil",
                    `Günün Programı, antrenman başlamadan ${settings.attendance_window_before_minutes} dakika önce açılır ve başladıktan ${settings.attendance_window_after_minutes} dakika sonra kapanır.`,
                    [{ text: "Tamam" }]
                  );
                  return;
                }
                navigation.navigate("Attendance", { sessionId: item.id, groupId: item.group_id, groupName: item.groups?.name ?? "" });
              }}
            >
              <Text style={styles.rowGroup}>{item.groups?.name ?? "Grup atanmadı"}</Text>
              <Text style={styles.rowTime}>{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}</Text>
              <Text style={styles.rowVenue}>{item.venues?.name ?? "Salon atanmadı"}</Text>
              {!attendanceOpen && (
                <Text style={styles.rowHint}>{past ? "🔒 Sadece önizleme" : "Yoklama henüz açık değil"}</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, flex: 1 },
  historyLink: { color: colors.yellow, fontSize: 12, fontWeight: "700" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  rowGroup: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  rowTime: { color: colors.teal, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  rowVenue: { color: colors.muted, fontSize: 13 },
  rowDisabled: { opacity: 0.5 },
  rowHint: { color: colors.coral, fontSize: 12, marginTop: spacing.sm },
});
