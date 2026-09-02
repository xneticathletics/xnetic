import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing, accentRotation, accentSoftRotation } from "../theme/tokens";
import { listCoachesWithGroups, getAllCoachBranches, type CoachWithGroups, type CoachBranchInfo } from "../lib/api/coaches";
import { listGroups, type Group } from "../lib/api/groups";
import { listVenues, type Venue } from "../lib/api/venues";
import { listBranches, type Branch } from "../lib/api/branches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useBranchSelect } from "../context/BranchSelectContext";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachesList">;

export default function CoachesListScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { selectedBranch, setSelectedBranch } = useBranchSelect();

  const [coaches, setCoaches] = useState<CoachWithGroups[]>([]);
  const [coachBranches, setCoachBranches] = useState<Record<string, CoachBranchInfo[]>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [venueFilter, setVenueFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [c, cb, b, v, g] = await Promise.all([
        listCoachesWithGroups(), getAllCoachBranches(), listBranches(), listVenues(), listGroups(),
      ]);
      setCoaches(c);
      setCoachBranches(cb);
      setBranches(b);
      setVenues(v);
      setGroups(g);
    } catch (e: any) {
      setError(e.message ?? "Antrenörler yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  // Branşa göre önce grupları daraltıyoruz.
  const branchGroups = useMemo(
    () => (selectedBranch ? groups.filter((g) => g.branch === selectedBranch) : groups),
    [groups, selectedBranch]
  );
  const branchGroupIds = useMemo(() => new Set(branchGroups.map((g) => g.id)), [branchGroups]);

  // Salon filtresindeki seçenekler de artık sadece seçili branşta
  // gerçekten kullanılan salonlarla sınırlı.
  const branchVenues = useMemo(() => {
    if (!selectedBranch) return venues;
    const usedVenueIds = new Set(branchGroups.map((g) => g.venue_id).filter(Boolean));
    return venues.filter((v) => usedVenueIds.has(v.id));
  }, [venues, branchGroups, selectedBranch]);

  // Bir grubun hangi salona ait olduğunu hızlıca bulmak için.
  const venueByGroupId = useMemo(() => {
    const map: Record<string, string | null> = {};
    groups.forEach((g) => { map[g.id] = g.venue_id; });
    return map;
  }, [groups]);

  // Hangi antrenörlerin (en az) bir branşın koordinatörü olduğunu — bu
  // bilgi zaten Branşlar üzerinden yüklü, ayrı bir sorgu gerekmiyor.
  const coordinatorCoachIds = useMemo(
    () => new Set(branches.filter((b) => b.coordinator_user_id).map((b) => b.coordinator_user_id as string)),
    [branches]
  );

  const filteredCoaches = useMemo(() => {
    let list = coaches;
    if (selectedBranch) {
      // Filtre, antrenörün UZMAN OLDUĞU branşlara göre çalışmalı — henüz
      // hiç grubu olmayan bir antrenör bile, o branşta uzmansa burada
      // görünmeli (amaç zaten ona grup atayabilmek).
      list = list.filter((c) => (coachBranches[c.id] ?? []).some((b) => b.branch_name === selectedBranch));
    }
    if (venueFilter) {
      list = list.filter((c) => c.groupIds.some((gid) => venueByGroupId[gid] === venueFilter));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [coaches, query, venueFilter, venueByGroupId, selectedBranch, coachBranches]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("InviteUser", { presetRole: "coach" })}
      >
        <Text style={styles.addButtonText}>+ Antrenör Ekle</Text>
      </TouchableOpacity>

      {branches.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedBranch && styles.chipActive]}
            onPress={() => setSelectedBranch(null)}
          >
            <Text style={[styles.chipText, !selectedBranch && styles.chipTextActive]}>Tüm Branşlar</Text>
          </TouchableOpacity>
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.chip, selectedBranch === b.name && styles.chipActive]}
              onPress={() => setSelectedBranch(b.name)}
            >
              <Text style={[styles.chipText, selectedBranch === b.name && styles.chipTextActive]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {branchVenues.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <TouchableOpacity
            style={[styles.chip, !venueFilter && styles.chipActive]}
            onPress={() => setVenueFilter(null)}
          >
            <Text style={[styles.chipText, !venueFilter && styles.chipTextActive]}>Tüm Salonlar</Text>
          </TouchableOpacity>
          {branchVenues.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.chip, venueFilter === v.id && styles.chipActive]}
              onPress={() => setVenueFilter(v.id)}
            >
              <Text style={[styles.chipText, venueFilter === v.id && styles.chipTextActive]}>{v.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TextInput
        style={styles.search}
        placeholder="Antrenör ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filteredCoaches}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ paddingBottom: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {query || venueFilter || selectedBranch ? "Eşleşen antrenör bulunamadı." : "Henüz antrenör yok."}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          const myBranches = coachBranches[item.id] ?? [];
          const isCoordinator = coordinatorCoachIds.has(item.id);
          const accent = accentRotation[index % accentRotation.length];
          const accentSoft = accentSoftRotation[index % accentSoftRotation.length];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("CoachDetail", { coachId: item.id })}
            >
              <View style={styles.cardTopRow}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: accentSoft }]}>
                    <Text style={[styles.avatarText, { color: accent }]}>{item.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {isCoordinator && (
                    <View style={styles.coordinatorBadge}>
                      <Text style={styles.coordinatorBadgeText}>★ KOORDİNATÖR</Text>
                    </View>
                  )}
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>{item.groupNames.length} GRUP</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

              {myBranches.length > 0 ? (
                <Text style={styles.branchLevelLine} numberOfLines={1}>
                  {myBranches[0].branch_name} · {myBranches[0].level}. Kademe
                  {myBranches.length > 1 ? ` + ${myBranches.length - 1} branş` : ""}
                </Text>
              ) : (
                <Text style={styles.noBranchText}>Branş atanmadı</Text>
              )}

              <Text style={styles.rowGroups} numberOfLines={2}>
                {item.groupNames.length > 0 ? item.groupNames.join(", ") : "Henüz bir gruba atanmadı"}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.overviewButton} onPress={() => navigation.navigate("CoachesOverview")}>
        <Text style={styles.overviewButtonText}>Antrenör Atamaları</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  filterRow: { flexDirection: "row", marginBottom: spacing.xs, height: 32, flexGrow: 0, flexShrink: 0 },
  chip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, marginRight: spacing.xs,
    alignItems: "center", justifyContent: "center", height: 28, flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  chipTextActive: { color: colors.bg },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  addButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 12,
    alignItems: "center", marginBottom: spacing.sm,
  },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm,
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { fontWeight: "800", fontSize: 16 },
  groupBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.bg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  groupBadgeText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  coordinatorBadge: {
    backgroundColor: colors.yellow, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  coordinatorBadgeText: { color: colors.bg, fontSize: 9, fontWeight: "800" },
  cardName: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  branchLevelLine: { color: colors.teal, fontSize: 10, fontWeight: "600", marginTop: 2 },
  noBranchText: { color: colors.muted, fontSize: 10, marginTop: 2 },
  rowGroups: { color: colors.muted, fontSize: 10, marginTop: 4 },
  overviewButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.sm,
  },
  overviewButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
