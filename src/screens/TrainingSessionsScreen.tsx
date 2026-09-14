import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listSessions, listSessionsForGroups, completeSession, completeSessions, deleteSession, shouldAutoComplete,
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
import FilterChipRow from "../components/FilterChipRow";
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
const WEEKDAY_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const MONTH_LABELS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

// "2026-09-13" -> "13 Eylül, Pazar"
function formatSelectedDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekdayIdx = (dateObj.getDay() + 6) % 7; // Pzt=0
  return `${d} ${MONTH_LABELS[m - 1]}, ${WEEKDAY_FULL[weekdayIdx]}`;
}

function toDateKey(year: number, month0: number, day: number) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function todayKey() {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

// Verilen günün içinde bulunduğu haftanın Pazartesi'sini bulur — haftalık
// görünümdeki 7 günlük satırın başlangıcı için.
function startOfWeek(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = (date.getDay() + 6) % 7; // Pzt=0
  date.setDate(date.getDate() - weekday);
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildWeekGrid(selectedDate: string): string[] {
  const start = startOfWeek(selectedDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
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
  // Takvimin en üstündeki "Tümü / Antrenman / Müsabaka" filtresi — hem
  // aylık ızgaradaki noktaları hem seçili günün altındaki listeyi etkiler.
  const [typeFilter, setTypeFilter] = useState<"all" | "training" | "match">("all");
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  // Aylık ızgara (varsayılan) yerine tek satırlık haftalık görünüm —
  // kullanıcı seçtiği görünümde kalır, ekran her odaklandığında sıfırlanmaz.
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");

  const selectBranch = (name: string | null) => {
    setBranchFilter(name);
    setGroupFilter(null);
  };

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Eskiden burada 3 AYRI ardışık ağ "dalgası" vardı (bu sorgular ->
      // isCoach ise ayrıca getMyBranchGroupIds -> sonra antrenman/maç/kadro
      // sorguları) — her dalga bir önceki bitmeden başlayamadığı için
      // Takvim'in her açılışında gözle görülür bir toplam gecikme
      // birikiyordu. getMyBranchGroupIds ve getGroupStaffingMap aslında bu
      // ilk gruptaki hiçbir sonuca bağlı değil (kendi bağımsız sorgularını
      // yapıyorlar) — o yüzden ikisi de BURAYA, tek dalgaya taşındı.
      const [groups, branchList, myVenueIds, myBranchGroupIds, fetchedStaffing] = await Promise.all([
        listGroups(), listBranches(), getMyAuthorizedVenueIds(),
        isCoach ? getMyBranchGroupIds() : Promise.resolve<string[]>([]),
        getGroupStaffingMap(),
      ]);
      setAllGroups(groups);
      setBranches(branchList);
      setAuthorizedVenueIds(myVenueIds);
      setStaffing(fetchedStaffing);
      if (isCoach) setMyGroupIds(new Set(myBranchGroupIds));

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
      if (isCoach) {
        // Düz (koordinatör olmayan) antrenör takvimde SADECE kendi branşının
        // programını görür — koçluğunu yaptığı gruplarla sınırlı değil,
        // coach_branches'taki tüm branşındaki antrenman/maçlar dahil.
        [fetched, fetchedMatches] = await Promise.all([
          listSessionsForGroups(myBranchGroupIds), listMatchesForGroups(myBranchGroupIds),
        ]);
      } else if (selectedBranch) {
        // Kulüp Admini bir branş seçtiyse (çoklu branşlı kulüp), o
        // branştaki grupların antrenmanlarıyla sınırla.
        const groupIds = groups.filter((g) => g.branch === selectedBranch).map((g) => g.id);
        [fetched, fetchedMatches] = await Promise.all([
          listSessionsForGroups(groupIds), listMatchesForGroups(groupIds),
        ]);
      } else {
        [fetched, fetchedMatches] = await Promise.all([listSessions(), listMatches()]);
      }

      // Bitişinden belirli süre geçmiş, hâlâ "planned" antrenmanları
      // sessizce otomatik "Tamamlandı" yap — gerçek bir arka plan görevi
      // kurulana kadar bu, ekran her açıldığında/yenilendiğinde çalışır.
      const toAutoComplete = fetched.filter((s) => shouldAutoComplete(s, settings.auto_complete_after_minutes));
      if (toAutoComplete.length > 0) {
        await completeSessions(toAutoComplete.map((s) => s.id)).catch(() => {});
        fetched = fetched.map((s) =>
          toAutoComplete.some((a) => a.id === s.id) ? { ...s, status: "completed" as const } : s
        );
      }

      setSessions(fetched);
      setMatches(fetchedMatches);
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

  // Müsabakaları da aynı şekilde branş/grup filtreliyoruz — "Takvimime
  // Ekle" (senkron) her zaman ikisini de kapsar, üstteki Tümü/Antrenman/
  // Müsabaka filtresinden ETKİLENMEZ, o filtre sadece görüntülemeyi
  // (aşağıdaki sessionsByDate/matchesByDate) etkiler.
  const filteredMatches = useMemo(
    () => (groupFilter ? branchScopedMatches.filter((m) => m.group_id === groupFilter) : branchScopedMatches),
    [branchScopedMatches, groupFilter]
  );

  // Antrenmanları tarihe göre grupla — takvimde hangi günde kaç
  // antrenman olduğunu ve seçili günün listesini hızlıca bulmak için.
  // typeFilter "Müsabaka" iken boş dönüp antrenmanları hem ızgaradan hem
  // gün listesinden gizliyor.
  const sessionsByDate = useMemo(() => {
    if (typeFilter === "match") return {};
    const map: Record<string, TrainingSession[]> = {};
    for (const s of filteredSessions) {
      (map[s.session_date] ??= []).push(s);
    }
    return map;
  }, [filteredSessions, typeFilter]);

  const matchesByDate = useMemo(() => {
    if (typeFilter === "training") return {};
    const map: Record<string, MatchRow[]> = {};
    for (const m of filteredMatches) {
      (map[m.match_date] ??= []).push(m);
    }
    return map;
  }, [filteredMatches, typeFilter]);

  const monthGrid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const weekDates = useMemo(() => buildWeekGrid(selectedDate), [selectedDate]);

  // Ay görünümünde ay ızgarasındaki (null dolgulu) günleri, hafta
  // görünümünde ise seçili günün haftasındaki 7 günü aynı hücre şekline
  // ({ day, dateKey } | null) dönüştürür — aşağıdaki ızgara render'ı
  // ikisi için de aynı kalır, sadece kaynak diziyi değiştiriyoruz.
  const displayCells = useMemo(() => {
    if (calendarView === "week") {
      return weekDates.map((dateKey) => ({ day: Number(dateKey.split("-")[2]), dateKey }));
    }
    return monthGrid.map((day) => (day === null ? null : { day, dateKey: toDateKey(viewYear, viewMonth, day) }));
  }, [calendarView, weekDates, monthGrid, viewYear, viewMonth]);

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

  // Haftalık görünümdeyken ‹ › butonları aya değil, 7'şer gün ileri/geri
  // haftaya kayar — seçili gün değişince ay görünümüne dönüldüğünde doğru
  // ay gösterilsin diye viewYear/viewMonth de aynı anda güncellenir.
  const shiftWeek = (deltaDays: number) => {
    const next = addDays(selectedDate, deltaDays);
    const [y, m] = next.split("-").map(Number);
    setSelectedDate(next);
    setViewYear(y);
    setViewMonth(m - 1);
  };
  const goPrev = () => (calendarView === "week" ? shiftWeek(-7) : goPrevMonth());
  const goNext = () => (calendarView === "week" ? shiftWeek(7) : goNextMonth());

  // "Antrenman Ekle" doğrudan tek bir antrenman formuna açmıyor — önce
  // günlük (tek antrenman) mi yoksa haftalık (şablondan otomatik üretim)
  // mi planlanacağını soruyor. Haftalık Program artık ayrı bir kutu değil,
  // bu seçimin bir seçeneği. Sağ alttaki "+" menüsünden çağrılıyor, o
  // yüzden önce menüyü kapatıyor.
  const handleAddTrainingPress = () => {
    setAddSheetVisible(false);
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

  const handleAddMatchPress = () => {
    setAddSheetVisible(false);
    navigation.navigate("MatchForm", { matchId: undefined });
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

  const canAddAnything = canManageSchedule || !isCoach;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Takvim</Text>
        <View style={styles.titleActionsRow}>
          <TouchableOpacity style={styles.titleActionButton} onPress={() => navigation.navigate("MatchResults")}>
            <Text style={styles.titleActionButtonText} numberOfLines={1}>🏆 Sonuçlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.titleActionButton} onPress={handleCalendarSync} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.titleActionButtonText} numberOfLines={1}>📲 Takvimime Ekle</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.segmentedRow}>
        {(
          [
            { key: "all" as const, label: "Tümü" },
            { key: "training" as const, label: "Antrenman" },
            { key: "match" as const, label: "Müsabaka" },
          ]
        ).map((opt) => {
          const active = typeFilter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.segmentButton, active && styles.segmentButtonActive]}
              onPress={() => setTypeFilter(opt.key)}
            >
              <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {showBranchChips && (
        <FilterChipRow
          options={[{ key: null, label: "Tüm Branşlar" }, ...visibleBranches.map((b) => ({ key: b.name, label: b.name }))]}
          activeKey={branchFilter}
          onSelect={selectBranch}
          style={{ marginTop: 2 }}
          showScrollHint
        />
      )}

      {showGroupChips && groupOptions.length > 1 && (
        <FilterChipRow
          options={[{ key: null, label: "Tüm Gruplar" }, ...groupOptions.map((g) => ({ key: g.id, label: g.name }))]}
          activeKey={groupFilter}
          onSelect={setGroupFilter}
          style={{ marginTop: 2 }}
          showScrollHint
        />
      )}

      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={goPrev}
          style={styles.monthNavButton}
          accessibilityLabel={calendarView === "week" ? "Önceki hafta" : "Önceki ay"}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.monthNavIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_LABELS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={styles.monthNavButton}
          accessibilityLabel={calendarView === "week" ? "Sonraki hafta" : "Sonraki ay"}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.monthNavIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((w) => (
          <Text key={w} style={styles.weekdayLabel}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {displayCells.map((cell, idx) => {
          if (cell === null) return <View key={idx} style={styles.dayCell} />;
          const { day, dateKey } = cell;
          const daySessions = sessionsByDate[dateKey] ?? [];
          const dayMatches = matchesByDate[dateKey] ?? [];
          const hasSessions = daySessions.length > 0;
          const hasMatches = dayMatches.length > 0;
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey();

          const hasBoth = hasSessions && hasMatches;

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
                isAdmin: role === "club_admin",
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

          const cellMonth0 = Number(dateKey.split("-")[1]) - 1;
          const dayLabel = `${day} ${MONTH_LABELS[cellMonth0]}${isToday ? ", bugün" : ""}${
            hasBoth ? ", antrenman ve müsabaka var" : hasSessions ? ", antrenman var" : hasMatches ? ", müsabaka var" : ""
          }`;

          return (
            <TouchableOpacity
              key={idx}
              style={styles.dayCell}
              onPress={handleDayPress}
              activeOpacity={0.7}
              accessibilityLabel={dayLabel}
              accessibilityState={{ selected: isSelected }}
            >
              {/* Her gün, çerçeveli bir kutu içinde gösteriliyor — dolgu
                  rengi türe göre DEĞİŞMİYOR, tür bilgisi altındaki küçük
                  noktalarla (sarı=antrenman, kırmızı=müsabaka, ikisi varsa
                  ikisi birden) veriliyor. Seçili gün sarı dolgu, "bugün"
                  (seçili değilken) kalın teal çerçeveyle belli olur. */}
              <View
                style={[
                  styles.dayBox,
                  isSelected && styles.dayBoxSelected,
                  !isSelected && isToday && styles.dayBoxToday,
                ]}
              >
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{day}</Text>
                <View style={styles.dayDotsRow}>
                  {hasSessions && <View style={[styles.dayDot, { backgroundColor: colors.yellow }]} />}
                  {hasMatches && <View style={[styles.dayDot, { backgroundColor: colors.coral }]} />}
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
      </View>

      <View style={styles.selectedDateHeader}>
        <Text style={[styles.selectedDateLabel, { flex: 1 }]} numberOfLines={1}>{formatSelectedDate(selectedDate)}</Text>
        <TouchableOpacity
          style={styles.viewToggleButton}
          onPress={() => setCalendarView((v) => (v === "month" ? "week" : "month"))}
          accessibilityLabel={calendarView === "month" ? "Haftalık görünüme geç" : "Aylık görünüme geç"}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.viewToggleIcon}>{calendarView === "month" ? "▴" : "▾"}</Text>
        </TouchableOpacity>
        <Text style={[styles.selectedDateCount, { flex: 1, textAlign: "right" }]} numberOfLines={1}>
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
            isAdmin={role === "club_admin"}
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

      {canAddAnything && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddSheetVisible(true)}
          accessibilityLabel="Antrenman veya müsabaka ekle"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={addSheetVisible} transparent animationType="fade" onRequestClose={() => setAddSheetVisible(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setAddSheetVisible(false)}>
          <View style={styles.sheetCard}>
            {canManageSchedule && (
              <TouchableOpacity style={styles.sheetOption} onPress={handleAddTrainingPress}>
                <Text style={styles.sheetOptionText}>🗓 Antrenman Ekle</Text>
              </TouchableOpacity>
            )}
            {!isCoach && (
              <TouchableOpacity style={styles.sheetOption} onPress={handleAddMatchPress}>
                <Text style={styles.sheetOptionText}>🏆 Müsabaka Ekle</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setAddSheetVisible(false)}>
              <Text style={styles.sheetCancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  pageTitle: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  titleActionsRow: { flexDirection: "row", gap: spacing.xs },
  titleActionButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  titleActionButtonText: { color: colors.ink, fontWeight: "600", fontSize: 11 },

  segmentedRow: {
    flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.full,
    padding: 3, marginBottom: 4,
  },
  segmentButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 7, borderRadius: radius.full },
  segmentButtonActive: { backgroundColor: colors.yellow },
  segmentButtonText: { color: colors.muted, fontWeight: "600", fontSize: 12.5 },
  segmentButtonTextActive: { color: colors.bg, fontWeight: "700" },

  error: { color: colors.coral, marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.xs, marginBottom: spacing.xs },
  monthNavButton: { paddingHorizontal: spacing.md, paddingVertical: 2 },
  monthNavIcon: { color: colors.yellow, fontSize: 18, fontWeight: "700" },
  monthLabel: { color: colors.ink, fontSize: 14, fontWeight: "700", minWidth: 130, textAlign: "center" },

  weekdayRow: { flexDirection: "row", marginBottom: 2 },
  weekdayLabel: { width: `${100 / 7}%`, textAlign: "center", color: colors.muted, fontSize: 10, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, padding: 2 },
  // Her gün çerçeveli, dolgulu bir kutu — düz bir daire yerine gerçek bir
  // "hücre" görünümü versin diye. Dolgu rengi türe göre DEĞİŞMEZ, sadece
  // seçili/bugün durumunu gösterir.
  dayBox: {
    width: "100%", aspectRatio: 1, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 3,
  },
  dayBoxSelected: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  dayBoxToday: { borderColor: colors.teal, borderWidth: 2 },
  dayNumber: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  dayNumberSelected: { color: colors.bg, fontWeight: "800" },
  dayDotsRow: { flexDirection: "row", gap: 3, height: 5, alignItems: "center" },
  dayDot: { width: 5, height: 5, borderRadius: 2.5 },

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
  viewToggleButton: {
    width: 28, height: 22, borderRadius: radius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center",
    marginHorizontal: spacing.sm,
  },
  viewToggleIcon: { color: colors.yellow, fontSize: 12, fontWeight: "700" },

  fab: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.yellow,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  fabIcon: { color: colors.bg, fontSize: 28, fontWeight: "700", lineHeight: 30 },

  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheetCard: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl,
  },
  sheetOption: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  sheetOptionText: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  sheetCancel: { paddingVertical: spacing.md, alignItems: "center" },
  sheetCancelText: { color: colors.muted, fontSize: 15, fontWeight: "600" },
});
