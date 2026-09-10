import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listSessions, listSessionsForGroups, completeSession, deleteSession, shouldAutoComplete,
  type TrainingSession,
} from "../lib/api/trainingSessions";
import { listMatches, listMatchesForGroups, type MatchRow } from "../lib/api/matches";
import { getMyBranchGroupIds } from "../lib/api/myGroups";
import { syncScheduleToDeviceCalendar } from "../lib/calendarSync";
import { listGroups, type Group } from "../lib/api/groups";
import { listBranches, type Branch } from "../lib/api/branches";
import { getGroupStaffingMap, type GroupStaffing } from "../lib/api/coaches";
import { getMyAuthorizedVenueIds } from "../lib/api/venueCoaches";
import { generateSessionsFromTemplates } from "../lib/api/trainingSchedule";
import DayAgendaItem, { type DayItem } from "../components/DayAgendaItem";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useAuth } from "../context/AuthContext";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "TrainingSessions">;

const STATUS_LABEL: Record<string, string> = {
  planned: "Planlandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
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

// generateSessionsFromTemplates() iki ekstra sorgu (şablonlar + çakışma
// kontrolü için mevcut antrenmanlar) yapıyor — ekran her odaklandığında
// (sekmeler arası geçişte bile) çalıştırmak yerine, bu modül-seviyesi
// zaman damgasıyla en fazla birkaç saatte bir çalışacak şekilde
// sınırlıyoruz. Yeni şablonlar yine de birkaç saat içinde üretilmiş olur,
// ama Takvim'e her giriş çıkışta gereksiz iki ağ isteği eklenmez.
let lastTemplateGenAt = 0;
const TEMPLATE_GEN_THROTTLE_MS = 6 * 60 * 60 * 1000;

// Ay ızgarasını (Pazartesi başlangıçlı, 7 sütunlu) hücre dizisi olarak
// üretir — boş hücreler null'dır.
function buildMonthGrid(year: number, month0: number): (number | null)[] {
  const firstWeekday = (new Date(year, month0, 1).getDay() + 6) % 7; // Pzt=0
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function TrainingSessionsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { settings } = useClubSettings();
  const { selectedBranch, isLocked } = useBranchSelect();
  const isBranchCoordinator = role === "coach" && isLocked;
  const isCoach = role === "coach" && !isBranchCoordinator;

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffing, setStaffing] = useState<Record<string, GroupStaffing>>({});
  const [authorizedVenueIds, setAuthorizedVenueIds] = useState<string[]>([]);
  // Sadece isCoach (düz antrenör) için doldurulur — kendi branş(lar)ının
  // adlarını bulup branş filtre çubuğunu SADECE bunlarla sınırlamak için
  // (aksi halde programı zaten hiç görünmeyecek başka branşların filtre
  // etiketleri de listelenip tıklanınca boş sonuç verirdi).
  const [myGroupIds, setMyGroupIds] = useState<Set<string> | null>(null);
  // Antrenman EKLEME/SİLME yetkisi: admin, branş koordinatörü ya da en az
  // bir salonun yetkilisi olan antrenör. Sıradan (etiketsiz) bir antrenör
  // artık antrenman ekleyemez/silemez — sadece yoklama/tamamlama gibi
  // mevcut UPDATE işlemlerine devam eder.
  const canManageSchedule = !isCoach || authorizedVenueIds.length > 0;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  // undefined = henüz branş seçilmedi (grup filtresi gizli), null = "Tüm
  // Branşlar" seçildi, string = belirli bir branş.
  const [branchFilter, setBranchFilter] = useState<string | null | undefined>(undefined);
  const [groupFilter, setGroupFilter] = useState<string | null>(null); // null = Tüm Gruplar

  const selectBranch = (name: string | null) => {
    setBranchFilter(name);
    setGroupFilter(null);
  };

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [groups, branchList, myVenueIds] = await Promise.all([listGroups(), listBranches(), getMyAuthorizedVenueIds()]);
      setAllGroups(groups);
      setBranches(branchList);
      setAuthorizedVenueIds(myVenueIds);

      // Aktif haftalık program şablonlarının önümüzdeki ufkunu tazeler
      // (aidattaki topUpAllActivePlans ile aynı yerde/mantıkta) — sıradan
      // (etiketsiz) bir antrenör için RLS zaten insert'i reddeder, bu
      // yüzden sadece yönetme yetkisi olanlarda çağrılır, hata sessizce
      // yutulur. Yukarıdaki throttle sayesinde ekrana her giriş çıkışta
      // değil, en fazla birkaç saatte bir çalışıyor.
      const canManage = !isCoach || myVenueIds.length > 0;
      if (canManage && Date.now() - lastTemplateGenAt > TEMPLATE_GEN_THROTTLE_MS) {
        lastTemplateGenAt = Date.now();
        await generateSessionsFromTemplates().catch(() => {});
      }

      let fetched: TrainingSession[];
      let fetchedMatches: MatchRow[];
      let fetchedStaffing: Record<string, GroupStaffing>;
      if (isCoach) {
        // Düz (koordinatör olmayan) antrenör takvimde SADECE kendi branşının
        // programını görür — koçluğunu yaptığı gruplarla sınırlı değil,
        // coach_branches'taki tüm branşındaki antrenman/maçlar dahil.
        const groupIds = await getMyBranchGroupIds();
        setMyGroupIds(new Set(groupIds));
        [fetched, fetchedMatches, fetchedStaffing] = await Promise.all([
          listSessionsForGroups(groupIds), listMatchesForGroups(groupIds), getGroupStaffingMap(),
        ]);
      } else if (selectedBranch) {
        // Kulüp Admini bir branş seçtiyse (çoklu branşlı kulüp), o
        // branştaki grupların antrenmanlarıyla sınırla.
        const groupIds = groups.filter((g) => g.branch === selectedBranch).map((g) => g.id);
        [fetched, fetchedMatches, fetchedStaffing] = await Promise.all([
          listSessionsForGroups(groupIds), listMatchesForGroups(groupIds), getGroupStaffingMap(),
        ]);
      } else {
        [fetched, fetchedMatches, fetchedStaffing] = await Promise.all([
          listSessions(), listMatches(), getGroupStaffingMap(),
        ]);
      }

      // Bitişinden belirli süre geçmiş, hâlâ "planned" antrenmanları
      // sessizce otomatik "Tamamlandı" yap — gerçek bir arka plan görevi
      // kurulana kadar bu, ekran her açıldığında/yenilendiğinde çalışır.
      const toAutoComplete = fetched.filter((s) => shouldAutoComplete(s, settings.auto_complete_after_minutes));
      if (toAutoComplete.length > 0) {
        await Promise.all(toAutoComplete.map((s) => completeSession(s.id).catch(() => {})));
        fetched = fetched.map((s) =>
          toAutoComplete.some((a) => a.id === s.id) ? { ...s, status: "completed" as const } : s
        );
      }

      setSessions(fetched);
      setMatches(fetchedMatches);
      setStaffing(fetchedStaffing);
    } catch (e: any) {
      setError(e.message ?? "Program yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [isCoach, selectedBranch, settings.auto_complete_after_minutes]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleComplete = async (id: string) => {
    try {
      await completeSession(id);
      load();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "İşaretlenemedi", [{ text: "Tamam" }]);
    }
  };

  const handleDelete = (session: TrainingSession) => {
    Alert.alert(
      "Antrenmanı sil",
      "Bu geçmiş antrenman kaydını silmek istediğinden emin misin? Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSession(session.id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  // Branş → grup iki adımlı filtre: kulüp tek branşlıysa (ya da global
  // branş kilidi varsa) doğrudan o branşın gruplarını, çok branşlıysa
  // önce belirli bir branş seçilmesini bekleyip ancak ondan sonra grup
  // listesini gösteriyoruz — "Tüm Branşlar" seçiliyken grup filtresi AÇILMAZ.
  const effectiveBranchFilter = isLocked ? selectedBranch : branchFilter;
  // Düz antrenör için branş çubuğu SADECE kendi branş(lar)ıyla sınırlı —
  // programı zaten hiç görünmeyecek başka branşların etiketi listelenmez.
  const visibleBranches = useMemo(() => {
    if (!isCoach || !myGroupIds) return branches;
    const myBranchNames = new Set(allGroups.filter((g) => myGroupIds.has(g.id)).map((g) => g.branch));
    return branches.filter((b) => myBranchNames.has(b.name));
  }, [isCoach, myGroupIds, allGroups, branches]);
  const showBranchChips = !isLocked && visibleBranches.length > 1;
  const showGroupChips = !showBranchChips || typeof effectiveBranchFilter === "string";
  const groupOptions = useMemo(() => {
    let list = typeof effectiveBranchFilter === "string"
      ? allGroups.filter((g) => g.branch === effectiveBranchFilter)
      : allGroups;
    // Düz antrenör hiç branş seçmediyse (tek branşı varsa çip zaten
    // gizli) bile grup listesi kendi branşıyla sınırlı kalır.
    if (isCoach && myGroupIds) list = list.filter((g) => myGroupIds.has(g.id));
    return list.map((g) => ({ id: g.id, name: g.name }));
  }, [allGroups, effectiveBranchFilter, isCoach, myGroupIds]);

  // group_id -> branş adı haritası — antrenman/maç kayıtlarında branş bilgisi
  // doğrudan yok, grup üzerinden çözülüyor. Belirli bir branş seçiliyken
  // takvim SADECE o branşın etkinliklerini gösterir (hiç yoksa boş görünür).
  const branchByGroupId = useMemo(() => {
    const map: Record<string, string> = {};
    allGroups.forEach((g) => { map[g.id] = g.branch; });
    return map;
  }, [allGroups]);

  // Bireysel branşlarda (Yüzme, Atletizm vb.) sonuç skor yerine serbest
  // metin — gün listesinde hangi maçların bireysel branşa ait olduğunu
  // buradan çözüyoruz.
  const individualBranchNames = useMemo(
    () => new Set(branches.filter((b) => b.is_individual).map((b) => b.name)),
    [branches]
  );

  const branchScopedSessions = useMemo(() => {
    if (typeof effectiveBranchFilter !== "string") return sessions;
    return sessions.filter((s) => s.group_id && branchByGroupId[s.group_id] === effectiveBranchFilter);
  }, [sessions, effectiveBranchFilter, branchByGroupId]);

  const branchScopedMatches = useMemo(() => {
    if (typeof effectiveBranchFilter !== "string") return matches;
    return matches.filter((m) => m.group_id && branchByGroupId[m.group_id] === effectiveBranchFilter);
  }, [matches, effectiveBranchFilter, branchByGroupId]);

  const filteredSessions = useMemo(
    () => (groupFilter ? branchScopedSessions.filter((s) => s.group_id === groupFilter) : branchScopedSessions),
    [branchScopedSessions, groupFilter]
  );

  // Antrenmanları tarihe göre grupla — takvimde hangi günde kaç
  // antrenman olduğunu ve seçili günün listesini hızlıca bulmak için.
  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    for (const s of filteredSessions) {
      (map[s.session_date] ??= []).push(s);
    }
    return map;
  }, [filteredSessions]);

  // Müsabakaları da aynı şekilde tarihe göre grupla — takvimde
  // antrenmanlarla aynı günde, farklı bir simgeyle görünürler.
  const filteredMatches = useMemo(
    () => (groupFilter ? branchScopedMatches.filter((m) => m.group_id === groupFilter) : branchScopedMatches),
    [branchScopedMatches, groupFilter]
  );
  const matchesByDate = useMemo(() => {
    const map: Record<string, MatchRow[]> = {};
    for (const m of filteredMatches) {
      (map[m.match_date] ??= []).push(m);
    }
    return map;
  }, [filteredMatches]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedSessions = sessionsByDate[selectedDate] ?? [];
  const selectedMatches = matchesByDate[selectedDate] ?? [];

  // Seçili günün antrenman + maç listesini tek bir listede, saate göre
  // sıralı birleştiriyoruz — takvimde ikisi de aynı yerde görünsün.
  const dayItems = useMemo<DayItem[]>(() => {
    const items: DayItem[] = [
      ...selectedSessions.map((s) => ({ kind: "session" as const, data: s })),
      ...selectedMatches.map((m) => ({ kind: "match" as const, data: m })),
    ];
    return items.sort((a, b) => a.data.start_time.localeCompare(b.data.start_time));
  }, [selectedSessions, selectedMatches]);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  // "+Antrenman" artık doğrudan tek bir antrenman formuna açmıyor — önce
  // günlük (tek antrenman) mi yoksa haftalık (şablondan otomatik üretim)
  // mi planlanacağını soruyor. Haftalık Program artık ayrı bir kutu değil,
  // bu seçimin bir seçeneği.
  const handleAddPress = () => {
    Alert.alert(
      "Antrenman Planla",
      "Nasıl planlamak istersin?",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "📅 Haftalık Antrenman Planlama", onPress: () => navigation.navigate("WeeklySchedule") },
        { text: "🗓 Günlük Antrenman Planlama", onPress: () => navigation.navigate("TrainingSessionForm", { sessionId: undefined }) },
      ]
    );
  };

  const handleCalendarSync = async () => {
    setSyncing(true);
    try {
      const { count, skipped } = await syncScheduleToDeviceCalendar({ sessions: filteredSessions, matches: filteredMatches });
      const message = `${count} etkinlik telefonunun takvimine (X-NETIC takvimi) eklendi.${skipped > 0 ? ` ${skipped} tanesi saat bilgisi hatalı olduğu için atlandı.` : ""}`;
      Alert.alert("Takvime Eklendi", message, [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Takvime eklenemedi", [{ text: "Tamam" }]);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {canManageSchedule && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
            <Text style={styles.addButtonText} numberOfLines={1}>+Antrenman</Text>
          </TouchableOpacity>
        )}
        {!isCoach && (
          <TouchableOpacity
            style={styles.addMatchButton}
            onPress={() => navigation.navigate("MatchForm", { matchId: undefined })}
          >
            <Text style={styles.addMatchButtonText} numberOfLines={1}>+Müsabaka</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.resultsButton}
          onPress={() => navigation.navigate("MatchResults")}
        >
          <Text style={styles.resultsButtonText} numberOfLines={1}>Sonuçlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.syncButton} onPress={handleCalendarSync} disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.syncButtonText} numberOfLines={1}>Takvimime Ekle</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {showBranchChips && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupFilterRow}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <TouchableOpacity
            style={[styles.groupChip, branchFilter === null && styles.groupChipActive]}
            onPress={() => selectBranch(null)}
          >
            <Text style={[styles.groupChipText, branchFilter === null && styles.groupChipTextActive]}>Tüm Branşlar</Text>
          </TouchableOpacity>
          {visibleBranches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.groupChip, branchFilter === b.name && styles.groupChipActive]}
              onPress={() => selectBranch(b.name)}
            >
              <Text style={[styles.groupChipText, branchFilter === b.name && styles.groupChipTextActive]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showGroupChips && groupOptions.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupFilterRow}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <TouchableOpacity
            style={[styles.groupChip, !groupFilter && styles.groupChipActive]}
            onPress={() => setGroupFilter(null)}
          >
            <Text style={[styles.groupChipText, !groupFilter && styles.groupChipTextActive]}>Tüm Gruplar</Text>
          </TouchableOpacity>
          {groupOptions.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupChip, groupFilter === g.id && styles.groupChipActive]}
              onPress={() => setGroupFilter(g.id)}
            >
              <Text style={[styles.groupChipText, groupFilter === g.id && styles.groupChipTextActive]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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
          const daySessions = sessionsByDate[dateKey] ?? [];
          const dayMatches = matchesByDate[dateKey] ?? [];
          const hasSessions = daySessions.length > 0;
          const hasMatches = dayMatches.length > 0;
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey();

          const hasBoth = hasSessions && hasMatches;
          const fillColor = hasBoth ? colors.violet : hasSessions ? colors.yellow : hasMatches ? colors.coral : null;

          // İlk dokunuş sadece seçer (alttaki liste yerinde güncellenir) —
          // ZATEN seçili olan bir güne TEKRAR dokununca (ikinci dokunuş),
          // o günü tam ekran gösteren DayScheduleDetail'e geçilir.
          const handleDayPress = () => {
            if (isSelected) {
              navigation.navigate("DayScheduleDetail", {
                date: dateKey,
                sessions: daySessions,
                matches: dayMatches,
                staffing,
                isAdminOrCoordinator: !isCoach,
                authorizedVenueIds,
                individualBranchNames: Array.from(individualBranchNames),
                branchByGroupId,
                attendanceWindowBeforeMinutes: settings.attendance_window_before_minutes,
                attendanceWindowAfterMinutes: settings.attendance_window_after_minutes,
                completionWindowBeforeMinutes: settings.completion_window_before_minutes,
              });
            } else {
              setSelectedDate(dateKey);
            }
          };

          return (
            <TouchableOpacity
              key={idx}
              style={styles.dayCell}
              onPress={handleDayPress}
              activeOpacity={0.7}
            >
              {/* Dış halka SADECE "bugün"ü işaretler — dolgu rengini (antrenman/
                  müsabaka/ikisi de) hiç etkilemez, üstüne binmez. */}
              <View style={[styles.dayOuterRing, isToday && styles.dayOuterRingToday]}>
                <View
                  style={[
                    styles.dayCircle,
                    !!fillColor && { backgroundColor: fillColor },
                    isSelected && styles.dayCircleSelectedRing,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !!fillColor && styles.dayNumberOnFill,
                      isSelected && !fillColor && styles.dayNumberSelectedPlain,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.yellow }]} />
          <Text style={styles.legendLabel}>Antrenman</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.coral }]} />
          <Text style={styles.legendLabel}>Müsabaka</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.violet }]} />
          <Text style={styles.legendLabel}>İkisi de</Text>
        </View>
      </View>

      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateLabel}>{selectedDate}</Text>
        <Text style={styles.selectedDateCount}>
          {dayItems.length > 0 ? `${dayItems.length} etkinlik` : "Etkinlik yok"}
        </Text>
      </View>

      <FlatList
        data={dayItems}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Bu gün için antrenman ya da müsabaka planlanmamış.</Text> : null
        }
        renderItem={({ item }) => (
          <DayAgendaItem
            item={item}
            navigation={navigation}
            staffing={staffing}
            isAdminOrCoordinator={!isCoach}
            authorizedVenueIds={authorizedVenueIds}
            individualBranchNames={individualBranchNames}
            branchByGroupId={branchByGroupId}
            attendanceWindowBeforeMinutes={settings.attendance_window_before_minutes}
            attendanceWindowAfterMinutes={settings.attendance_window_after_minutes}
            completionWindowBeforeMinutes={settings.completion_window_before_minutes}
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        )}
      />
    </View>
  );
}

const CELL_SIZE = 30;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs, gap: 4 },
  title: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  addButton: { flex: 1, backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 8, alignItems: "center" },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 10.5 },
  addMatchButton: { flex: 1, borderWidth: 1, borderColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 8, alignItems: "center" },
  addMatchButtonText: { color: colors.coral, fontWeight: "700", fontSize: 10.5 },
  resultsButton: { flex: 1, borderWidth: 1, borderColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 8, alignItems: "center" },
  resultsButtonText: { color: colors.violet, fontWeight: "700", fontSize: 10.5 },
  syncButton: { flex: 1, backgroundColor: colors.teal, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 8, alignItems: "center" },
  syncButtonText: { color: colors.bg, fontWeight: "700", fontSize: 10.5 },
  error: { color: colors.coral, marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.xs, marginBottom: spacing.xs },
  groupFilterRow: { flexDirection: "row", marginTop: spacing.xs, maxHeight: 32 },
  groupChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, marginRight: spacing.xs,
    alignItems: "center", justifyContent: "center", height: 28,
  },
  groupChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  groupChipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  groupChipTextActive: { color: colors.bg },
  monthNavButton: { paddingHorizontal: spacing.md, paddingVertical: 2 },
  monthNavIcon: { color: colors.yellow, fontSize: 18, fontWeight: "700" },
  monthLabel: { color: colors.ink, fontSize: 14, fontWeight: "700", minWidth: 130, textAlign: "center" },

  weekdayRow: { flexDirection: "row", marginBottom: 2 },
  weekdayLabel: { width: `${100 / 7}%`, textAlign: "center", color: colors.muted, fontSize: 10, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, alignItems: "center", justifyContent: "center", paddingVertical: 2 },
  // Dış halka: SADECE "bugün" işareti — dolgu rengine hiç dokunmaz.
  dayOuterRing: {
    width: CELL_SIZE + 8, height: CELL_SIZE + 8, borderRadius: (CELL_SIZE + 8) / 2,
    alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: "transparent",
  },
  dayOuterRingToday: { borderColor: colors.ink },
  // İç daire: tür dolgusu (sarı/kırmızı/mor) + varsa "seçili" halkası —
  // seçim artık dolguyu EZMİYOR, sadece ince bir çerçeve olarak ekleniyor.
  dayCircle: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2,
    alignItems: "center", justifyContent: "center",
  },
  dayCircleSelectedRing: { borderWidth: 2.5, borderColor: colors.teal },
  dayNumber: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  dayNumberOnFill: { color: colors.bg, fontWeight: "800" },
  dayNumberSelectedPlain: { color: colors.teal, fontWeight: "800" },

  legendRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  selectedDateHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: spacing.sm, marginBottom: spacing.xs,
    borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.xs,
  },
  selectedDateLabel: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  selectedDateCount: { color: colors.muted, fontSize: 12 },
});
