import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import { listAthletesInGroups, listAllAthletes, type Athlete } from "../lib/api/athletes";
import { listGroups, type Group } from "../lib/api/groups";
import { listCheckinsForAthletesOnDate, type AthleteLatestCheckin } from "../lib/api/wellnessCheckins";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import DatePickerModal from "../components/DatePickerModal";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachWellness">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CoachWellnessScreen({ navigation }: Props) {
  const { role } = useAuth();
  const [rows, setRows] = useState<AthleteLatestCheckin[]>([]);
  const [athleteGroupId, setAthleteGroupId] = useState<Record<string, string | null>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // club_admin'in kendi koçluk yaptığı grup yoktur — kulüpteki TÜM
      // sporcuları görür. Antrenör sadece kendi grubundakileri görür.
      // Wellness check-in sadece müsabık sporcular için bir uygulama.
      const [athletes, allGroups] = await Promise.all([
        role === "club_admin" ? listAllAthletes() : listAthletesInGroups(await getMyCoachedGroupIds()),
        listGroups(),
      ]);
      const musabikAthletes: Athlete[] = athletes.filter((a) => a.athlete_type === "musabik");
      setGroups(allGroups);
      setAthleteGroupId(Object.fromEntries(musabikAthletes.map((a) => [a.id, a.group_id])));
      setRows(await listCheckinsForAthletesOnDate(musabikAthletes.map((a) => a.id), selectedDate));
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [role, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const branches = useMemo(() => Array.from(new Set(groups.map((g) => g.branch))).sort((a, b) => a.localeCompare(b, "tr")), [groups]);
  const groupsInBranch = useMemo(
    () => (branchFilter ? groups.filter((g) => g.branch === branchFilter) : groups),
    [groups, branchFilter]
  );

  const searching = query.trim().length > 0;
  const displayRows = useMemo(() => {
    let list = rows;
    if (searching) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => r.full_name.toLowerCase().includes(q));
    }
    if (groupFilter) {
      list = list.filter((r) => athleteGroupId[r.athlete_id] === groupFilter);
    } else if (branchFilter) {
      const groupIdsInBranch = new Set(groupsInBranch.map((g) => g.id));
      list = list.filter((r) => {
        const gid = athleteGroupId[r.athlete_id];
        return gid ? groupIdsInBranch.has(gid) : false;
      });
    }
    // Check-in yapanlar üstte listelensin — her iki grup içinde de isim
    // sırası korunur (stabil sıralama).
    return [...list].sort((a, b) => Number(!!b.latest) - Number(!!a.latest));
  }, [rows, query, searching, branchFilter, groupFilter, groupsInBranch, athleteGroupId]);

  const isToday = selectedDate === todayKey();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
    <View style={styles.container}>
      <Text style={styles.description}>
        Sporcuların her sabah kendi doldurduğu, uyku/enerji/kas ağrısı/ruh
        hâlini içeren günlük bir takip anketi. Resmi bir test değil — erken
        uyarı sinyali almak için buradan kimlerin doldurduğunu görebilirsin.
      </Text>

      <TouchableOpacity style={styles.dateFilter} onPress={() => setDatePickerVisible(true)}>
        <Text style={styles.dateFilterIcon}>📅</Text>
        <Text style={styles.dateFilterText}>{isToday ? `Bugün — ${formatDate(selectedDate)}` : formatDate(selectedDate)}</Text>
        <Text style={styles.dateFilterChange}>Değiştir</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.search}
        placeholder="Sporcu ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      {branches.length > 1 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !branchFilter && styles.filterChipActive]}
            onPress={() => {
              setBranchFilter(null);
              setGroupFilter(null);
            }}
          >
            <Text style={[styles.filterChipText, !branchFilter && styles.filterChipTextActive]}>Tüm Branşlar</Text>
          </TouchableOpacity>
          {branches.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.filterChip, branchFilter === b && styles.filterChipActive]}
              onPress={() => {
                setBranchFilter(b);
                setGroupFilter(null);
              }}
            >
              <Text style={[styles.filterChipText, branchFilter === b && styles.filterChipTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!branchFilter && groupsInBranch.length > 1 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChipGroup, !groupFilter && styles.filterChipGroupActive]}
            onPress={() => setGroupFilter(null)}
          >
            <Text style={[styles.filterChipText, !groupFilter && styles.filterChipTextActive]}>Tüm Gruplar</Text>
          </TouchableOpacity>
          {groupsInBranch.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.filterChipGroup, groupFilter === g.id && styles.filterChipGroupActive]}
              onPress={() => setGroupFilter(g.id)}
            >
              <Text style={[styles.filterChipText, groupFilter === g.id && styles.filterChipTextActive]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setDatePickerVisible(false)}
      />

      <FlatList
        data={displayRows}
        keyExtractor={(r) => r.athlete_id}
        contentContainerStyle={{ paddingBottom: spacing.xl, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {searching || branchFilter || groupFilter ? "Eşleşen sporcu bulunamadı." : "Müsabık sporcu bulunamadı."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("AthleteWellnessDetail", { athleteId: item.athlete_id, athleteName: item.full_name })}
            >
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.full_name}</Text>
                {item.latest ? (
                  <Text style={styles.rowSub}>Check-in yaptı</Text>
                ) : (
                  <Text style={styles.rowSubStale}>Bu tarihte check-in yapmadı</Text>
                )}
              </View>
              {item.latest && (
                <View style={styles.metricsBox}>
                  {item.latest.energy != null && <Text style={styles.metric}>⚡ {item.latest.energy}</Text>}
                  {item.latest.soreness != null && <Text style={styles.metric}>💪 {item.latest.soreness}</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  description: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  dateFilter: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, marginTop: spacing.sm, marginBottom: spacing.md,
  },
  dateFilterIcon: { fontSize: 15 },
  dateFilterText: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "700" },
  dateFilterChange: { color: colors.teal, fontSize: 12, fontWeight: "700" },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.sm,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.sm },
  filterChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  filterChipGroup: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  filterChipGroupActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  filterChipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rowSubStale: { color: colors.coral, fontSize: 11, marginTop: 2, fontWeight: "600" },
  metricsBox: { flexDirection: "row", gap: 6 },
  metric: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
