import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listSessionsByGroup, type TrainingSession } from "../lib/api/trainingSessions";
import { getAttendanceSummaryForSessions, type SessionAttendanceSummary } from "../lib/api/attendance";
import { listGroups, type Group } from "../lib/api/groups";
import { listBranches, type Branch } from "../lib/api/branches";
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

  // Sadece yönetici için: kaç branş varsa önce onlardan biri seçiliyor,
  // grup çipleri seçilen branşa göre daralıyor (kullanıcı isteği: "önce
  // branş, sonra gruplar"). Koordinatör/antrenör zaten kendi branşına/
  // gruplarına kilitli — onlar için ayrı bir branş adımı YOK, gruplar
  // direkt geliyor.
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [adminBranchFilter, setAdminBranchFilter] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
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
        let scoped: Group[];
        if (isAdmin) {
          scoped = all;
          const branchList = await listBranches();
          setAllBranches(branchList);
          // Tek branşlı kulüplerde ayrıca branş seçtirmeye gerek yok
          // (AnnouncementFormScreen'deki aynı kural) — direkt o branşın
          // grupları gösterilsin.
          if (branchList.length === 1) setAdminBranchFilter(branchList[0].name);
        } else if (isCoordinator) {
          scoped = all.filter((g) => g.branch === selectedBranch);
        } else {
          // Düz antrenör: sadece kendi koçluk ettiği gruplar.
          const myIds = new Set(await getMyCoachedGroupIds());
          scoped = all.filter((g) => myIds.has(g.id));
        }
        if (cancelled) return;
        setAllGroups(scoped);
        // Yönetici DIŞINDA (koordinatör/antrenör) branş adımı yok, gruplar
        // direkt geliyor. Tek grup varsa elle seçtirmeye de gerek yok.
        if (!isAdmin) {
          setGroups(scoped);
          if (scoped.length === 1) setSelectedGroupId(scoped[0].id);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Gruplar yüklenemedi");
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, isCoordinator, selectedBranch]);

  // Yalnızca yönetici: önce branş seçilmeli, gruplar ANCAK ondan sonra
  // çıkıyor (kullanıcı isteği — bir branş seçilmeden hiçbir grup
  // gösterilmiyor, çok branşlı bir kulüpte tüm gruplar tek listede
  // karışmasın diye). Branş değişince önceki seçili grup artık listede
  // olmayabilir, temizleniyor.
  useEffect(() => {
    if (!isAdmin) return;
    const visible = adminBranchFilter ? allGroups.filter((g) => g.branch === adminBranchFilter) : [];
    setGroups(visible);
    setSelectedGroupId((prev) => (prev && visible.some((g) => g.id === prev) ? prev : visible.length === 1 ? visible[0].id : null));
  }, [isAdmin, adminBranchFilter, allGroups]);

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

  // Yönetici birden çok branşa sahipse önce branş seçilmeli — grup çipleri
  // ancak ondan sonra çıkıyor. Koordinatör/antrenör için bu adım hiç yok,
  // kendi gruplarına direkt geliyor (isAdmin false ise allBranches boş kalır).
  const showBranchStep = isAdmin && allBranches.length > 1;

  return (
    <View style={styles.container}>
      {loadingGroups ? (
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      ) : isAdmin && allGroups.length === 0 ? (
        <Text style={styles.empty}>Kulüpte henüz grup yok.</Text>
      ) : !isAdmin && groups.length === 0 ? (
        <Text style={styles.empty}>Yönettiğin bir grup bulunamadı.</Text>
      ) : (
        <>
          {showBranchStep && (
            <View style={styles.groupChipRow}>
              {allBranches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.groupChip, adminBranchFilter === b.name && styles.groupChipActive]}
                  onPress={() => setAdminBranchFilter(b.name)}
                >
                  <Text style={[styles.groupChipText, adminBranchFilter === b.name && styles.groupChipTextActive]}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showBranchStep && !adminBranchFilter ? (
            <Text style={styles.empty}>Önce bir branş seç.</Text>
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
