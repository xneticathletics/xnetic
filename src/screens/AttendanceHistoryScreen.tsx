import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listSessionsByGroup, type TrainingSession } from "../lib/api/trainingSessions";
import { getAttendanceSummaryForSessions, type SessionAttendanceSummary } from "../lib/api/attendance";
import { listGroups, type Group } from "../lib/api/groups";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AttendanceHistory">;

function todayKey() {
  const d = new Date();
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" });
}

// "Yoklama Durumu" kutucuğundan (antrenör/yönetici) erişilir — Günün
// Programı SADECE bugünü gösterdiği için (kullanıcı isteği: "geçmişe
// yönelik antrenman katılım listesi") bir grup seçip o grubun TÜM geçmiş
// antrenmanlarını, yoklama alınıp alınmadığı özetiyle birlikte listeler.
// Bir satıra dokununca aynı Attendance ekranı açılır (admin her zaman,
// antrenör pencere kapandıysa sadece GÖRÜNTÜLER — Kaydet'e basınca zaten
// "henüz zamanı değil" der, bu yüzden burada ayrı bir salt-okunur mod
// gerekmiyor).
export default function AttendanceHistoryScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { isLocked, selectedBranch } = useBranchSelect();
  const isCoordinator = role === "coach" && isLocked;
  const isAdmin = role === "club_admin";

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [summaries, setSummaries] = useState<Record<string, SessionAttendanceSummary>>({});
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const all = await listGroups();
        let visible: Group[];
        if (isAdmin || isCoordinator) {
          visible = isCoordinator ? all.filter((g) => g.branch === selectedBranch) : all;
        } else {
          // Düz antrenör: sadece kendi koçluk ettiği gruplar.
          const myIds = new Set(await getMyCoachedGroupIds());
          visible = all.filter((g) => myIds.has(g.id));
        }
        if (cancelled) return;
        setGroups(visible);
        // Tek grup varsa elle seçtirmeye gerek yok.
        if (visible.length === 1) setSelectedGroupId(visible[0].id);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Gruplar yüklenemedi");
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, isCoordinator, selectedBranch]);

  const load = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      setError(null);
      const all = await listSessionsByGroup(selectedGroupId);
      const today = todayKey();
      // En yeniden eskiye — bugüne kadar (bugün dahil) geçmiş antrenmanlar.
      const past = all
        .filter((s) => s.session_date <= today)
        .sort((a, b) => `${b.session_date}${b.start_time}`.localeCompare(`${a.session_date}${a.start_time}`));
      setSessions(past);
      setSummaries(await getAttendanceSummaryForSessions(past.map((s) => s.id)));
    } catch (e: any) {
      setError(e.message ?? "Antrenmanlar yüklenemedi");
    } finally {
      setLoadingSessions(false);
      setRefreshing(false);
    }
  }, [selectedGroupId]);

  useFocusEffect(
    useCallback(() => {
      if (!selectedGroupId) return;
      setLoadingSessions(true);
      load();
    }, [selectedGroupId, load])
  );

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  return (
    <View style={styles.container}>
      {loadingGroups ? (
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      ) : groups.length === 0 ? (
        <Text style={styles.empty}>Yönettiğin bir grup bulunamadı.</Text>
      ) : (
        <>
          {groups.length > 1 && (
            <View style={styles.groupChipRow}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupChip, selectedGroupId === g.id && styles.groupChipActive]}
                  onPress={() => setSelectedGroupId(g.id)}
                >
                  <Text style={[styles.groupChipText, selectedGroupId === g.id && styles.groupChipTextActive]}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {!selectedGroupId ? (
            <Text style={styles.empty}>Bir grup seç.</Text>
          ) : loadingSessions ? (
            <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />
              }
              ListEmptyComponent={<Text style={styles.empty}>Bu grupta henüz geçmiş antrenman yok.</Text>}
              renderItem={({ item }) => {
                const summary = summaries[item.id];
                return (
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() =>
                      navigation.navigate("Attendance", {
                        sessionId: item.id,
                        groupId: item.group_id,
                        groupName: selectedGroup?.name ?? item.groups?.name ?? "",
                      })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowDate}>{formatDate(item.session_date)}</Text>
                      <Text style={styles.rowTime}>
                        {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}
                        {item.topic ? ` · ${item.topic}` : ""}
                      </Text>
                    </View>
                    {summary ? (
                      <Text style={styles.badgeTaken}>
                        {summary.geldi} geldi{summary.gelmedi > 0 ? ` · ${summary.gelmedi} gelmedi` : ""}
                      </Text>
                    ) : (
                      <Text style={styles.badgeMissing}>Yoklama alınmadı</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  groupChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  groupChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.surface,
  },
  groupChipActive: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  groupChipText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  groupChipTextActive: { color: colors.bg },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowDate: { color: colors.ink, fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  rowTime: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badgeTaken: { color: colors.teal, fontSize: 12, fontWeight: "700" },
  badgeMissing: { color: colors.coral, fontSize: 12, fontWeight: "700" },
});
