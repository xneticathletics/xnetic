import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, listMyCoachedGroups, type Group } from "../lib/api/groups";
import { listVenues, type Venue } from "../lib/api/venues";
import { listBranches, type Branch } from "../lib/api/branches";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";
import { getGroupStaffingMap, type GroupStaffing } from "../lib/api/coaches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteGroups">;

const NO_VENUE_ID = "__no_venue__";

export default function AthleteGroupsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { selectedBranch, isLocked } = useBranchSelect();
  // Branş Koordinatörü, kendi branşıyla sınırlı ama TÜM gruplarını gören
  // admin benzeri bir deneyim alır — bu yüzden onu "isCoach" (sadece
  // kendi koçluk yaptığı gruplar) mantığından hariç tutuyoruz.
  const isBranchCoordinator = role === "coach" && isLocked;
  const isCoach = role === "coach" && !isBranchCoordinator;

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [staffing, setStaffing] = useState<Record<string, GroupStaffing>>({});
  const [localBranch, setLocalBranch] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'da zaten bir branş seçildiyse (çoklu branşlı kulüp), bu
  // ekran o seçimi devralır — tekrar sormaz. Yine de aşağıdaki "‹
  // Branşlar" linkiyle buradan farklı bir branşa geçilebilir.
  useEffect(() => {
    if (selectedBranch && localBranch === null) setLocalBranch(selectedBranch);
  }, [selectedBranch]);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [g, b, v, s, a] = await Promise.all([
        isCoach ? listMyCoachedGroups() : listGroups(),
        isCoach ? Promise.resolve([]) : listBranches(),
        isCoach ? Promise.resolve([]) : listVenues(),
        isCoach ? Promise.resolve({}) : getGroupStaffingMap(),
        isCoach ? Promise.resolve([]) : listAllAthletes(),
      ]);
      setAllGroups(g);
      setBranches(b);
      setVenues(v);
      setStaffing(s);
      setAllAthletes(a);
    } catch (e: any) {
      setError(e.message ?? "Gruplar yüklenemedi");
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

  const showBranchStep = !isCoach && !isBranchCoordinator && branches.length > 1;

  // Branşa göre daralt (branş seçilmişse).
  const groups = useMemo(
    () => (localBranch ? allGroups.filter((g) => g.branch === localBranch) : allGroups),
    [allGroups, localBranch]
  );

  // Salona göre önce seçim ekranı yalnızca 1'den FAZLA salon varken
  // devreye girer. Salon listesi de artık (branş zaten filtrelendiği
  // için) sadece seçili branşta kullanılan salonları gösterir.
  const branchVenueIds = useMemo(() => new Set(groups.map((g) => g.venue_id).filter(Boolean)), [groups]);
  const branchVenues = useMemo(
    () => (localBranch ? venues.filter((v) => branchVenueIds.has(v.id)) : venues),
    [venues, branchVenueIds, localBranch]
  );
  const showVenueStep = !isCoach && branchVenues.length > 1;
  const hasUnassignedGroup = useMemo(() => groups.some((g) => !g.venue_id), [groups]);

  const visibleGroups = useMemo(() => {
    if (!showVenueStep || !selectedVenueId) return groups;
    if (selectedVenueId === NO_VENUE_ID) return groups.filter((g) => !g.venue_id);
    return groups.filter((g) => g.venue_id === selectedVenueId);
  }, [groups, showVenueStep, selectedVenueId]);

  // Sporcu arama — hangi ekranda olursan ol (branş/salon seçim ekranları
  // dahil) her zaman en üstte, tek tek gruba girmeden doğrudan bulup
  // açabilesin.
  const branchGroupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    let list = allAthletes.filter((a) => a.full_name.toLowerCase().includes(q));
    if (localBranch) list = list.filter((a) => a.group_id && branchGroupIds.has(a.group_id));
    return list;
  }, [allAthletes, query, localBranch, branchGroupIds]);

  const isSearching = query.trim().length > 0;

  const topBar = (
    <>
      {!isCoach && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.allAthletesBox} onPress={() => navigation.navigate("AllAthletes")}>
            <Text style={styles.allAthletesBoxText}>📋 Tüm Sporcular</Text>
          </TouchableOpacity>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.importButton}
              onPress={() => navigation.navigate("AthleteBulkImport")}
            >
              <Text style={styles.importButtonText}>Excelden Aktar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AthleteForm", { athleteId: undefined })}
            >
              <Text style={styles.addButtonText}>+ Yeni Sporcu</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isCoach && (
        <TextInput
          style={styles.search}
          placeholder="Sporcu ara..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      )}
    </>
  );

  if (isSearching) {
    return (
      <View style={styles.container}>
        {topBar}
        {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
        {error && <Text style={styles.error}>{error}</Text>}
        <FlatList
          data={searchResults}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>Eşleşen sporcu bulunamadı.</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("AthleteDetail", { athleteId: item.id })}
            >
              <Text style={styles.rowName}>{item.full_name}</Text>
              <Text style={styles.rowSub}>{item.groups?.name ?? "Grup atanmadı"}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (showBranchStep && !localBranch) {
    return (
      <View style={styles.container}>
        {topBar}
        <Text style={styles.subtitle}>Önce bir branş seç</Text>

        {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          data={branches}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setLocalBranch(item.name);
                // Not: burada global setSelectedBranch'i BİLEREK
                // çağırmıyoruz — bu seçim sadece bu ekrana özel kalsın,
                // Ana Sayfa'ya çıkıp geri dönünce branş seçme adımı
                // sıfırdan başlasın.
              }}
            >
              <View style={styles.venueRowInner}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (showVenueStep && !selectedVenueId) {
    const venueRows = hasUnassignedGroup
      ? [...branchVenues, { id: NO_VENUE_ID, name: "Salon Atanmamış", address: null, capacity: null }]
      : branchVenues;
    return (
      <View style={styles.container}>
        {topBar}
        {showBranchStep && (
          <TouchableOpacity onPress={() => setLocalBranch(null)}>
            <Text style={styles.backToVenues}>‹ Branşlar</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.subtitle}>Önce bir salon seç</Text>

        {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          data={venueRows}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => setSelectedVenueId(item.id)}>
              <View style={styles.venueRowInner}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {topBar}

      {showVenueStep ? (
        <TouchableOpacity onPress={() => setSelectedVenueId(null)}>
          <Text style={styles.backToVenues}>‹ Salonlar</Text>
        </TouchableOpacity>
      ) : showBranchStep ? (
        <TouchableOpacity onPress={() => setLocalBranch(null)}>
          <Text style={styles.backToVenues}>‹ Branşlar</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.subtitle}>Sporcuları görmek için bir grup seç</Text>
      )}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={visibleGroups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {isCoach
                ? "Henüz sana atanmış bir grup yok. Kulüp Admini ile iletişime geç."
                : "Henüz grup yok. Profil → Kulüp Ayarları'ndan grup ekleyebilirsin."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const s = staffing[item.id];
          const coachNames = s ? [s.headName, ...s.assistantNames].filter(Boolean) as string[] : [];
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("AthletesList", { groupId: item.id, groupName: item.name })}
            >
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowSub}>{item.branch}</Text>
              {!isCoach && (
                <Text style={styles.rowCoaches}>
                  {coachNames.length > 0 ? coachNames.join(", ") : "Antrenör atanmadı"}
                </Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  backToVenues: { color: colors.teal, fontSize: 13, fontWeight: "700", marginBottom: spacing.md },
  headerButtons: { flexDirection: "row", gap: spacing.xs },
  importButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10,
  },
  importButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  allAthletesBox: {
    backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  allAthletesBoxText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.md },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  venueRowInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowCoaches: { color: colors.teal, fontSize: 12, marginTop: 4 },
  chevron: { color: colors.yellow, fontSize: 20, fontWeight: "700" },
});
