import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing, accentRotation, accentSoftRotation } from "../theme/tokens";
import { listCoachesWithGroups, getAllCoachBranches, type CoachWithGroups, type CoachBranchInfo } from "../lib/api/coaches";
import { listGroups, type Group } from "../lib/api/groups";
import { listVenues, type Venue } from "../lib/api/venues";
import { getAllCoachVenueIds } from "../lib/api/venueCoaches";
import { listBranches, type Branch } from "../lib/api/branches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useAuth } from "../context/AuthContext";
import { useResponsiveColumns, fillGridRow } from "../hooks/useResponsiveColumns";
import FilterChipRow from "../components/FilterChipRow";
import Avatar from "../components/Avatar";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachesList">;

export default function CoachesListScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { selectedBranch, setSelectedBranch, isLocked } = useBranchSelect();
  const isBranchCoordinator = role === "coach" && isLocked;
  const columns = useResponsiveColumns(2);

  const [coaches, setCoaches] = useState<CoachWithGroups[]>([]);
  const [coachBranches, setCoachBranches] = useState<Record<string, CoachBranchInfo[]>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [coachVenueIds, setCoachVenueIds] = useState<Record<string, string[]>>({});
  const [venueFilter, setVenueFilter] = useState<string | null>(null);
  // Pasifleştirilmiş ("Kulüpten Çıkar") antrenörler eskiden listede hiç
  // görünmüyordu — bir daha bulunamıyor, ne aktifleştirilebiliyor ne kalıcı
  // silinebiliyordu (canlıda yaşandı: aynı telefonla tekrar oluşturulamadı,
  // çünkü giriş kimliği hâlâ rezerveydi). Kullanıcı isteğiyle ayrı bir
  // düğme yerine club_admin için her zaman açık — pasifler "PASİF"
  // etiketiyle soluk gösteriliyor.
  const showInactive = role === "club_admin";

  // Salon filtresi sadece bir branş seçiliyken görünüyor — branş değişince
  // (veya "Tüm Branşlar"a dönülünce) eskisi ekranda görünmeden aktif
  // kalmasın diye sıfırlıyoruz.
  useEffect(() => {
    setVenueFilter(null);
  }, [selectedBranch]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [c, cb, b, v, g, cv] = await Promise.all([
        listCoachesWithGroups(showInactive ? { includeInactive: true } : undefined),
        getAllCoachBranches(), listBranches(), listVenues(), listGroups(), getAllCoachVenueIds(),
      ]);
      setCoaches(c);
      setCoachBranches(cb);
      setBranches(b);
      setVenues(v);
      setGroups(g);
      setCoachVenueIds(cv);
    } catch (e: any) {
      setError(e.message ?? "Antrenörler yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [showInactive]);

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
      <TouchableOpacity style={styles.overviewButton} onPress={() => navigation.navigate("CoachesOverview")}>
        <Text style={styles.overviewButtonText}>Antrenör Atamaları</Text>
      </TouchableOpacity>

      {!isBranchCoordinator && branches.length > 1 && (
        <FilterChipRow
          options={[{ key: null, label: "Tüm Branşlar" }, ...branches.map((b) => ({ key: b.name, label: b.name }))]}
          activeKey={selectedBranch}
          onSelect={setSelectedBranch}
          style={styles.filterRow}
          showScrollHint
        />
      )}

      {selectedBranch && branchVenues.length > 1 && (
        <FilterChipRow
          options={[{ key: null, label: "Tüm Salonlar" }, ...branchVenues.map((v) => ({ key: v.id, label: v.name }))]}
          activeKey={venueFilter}
          onSelect={setVenueFilter}
          style={styles.filterRow}
          showScrollHint
        />
      )}

      <TextInput
        style={styles.search}
        placeholder="Antrenör ara..."
        placeholderTextColor={colors.muted}
        accessibilityLabel="Antrenör ara"
        value={query}
        onChangeText={setQuery}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        key={`cols-${columns}`}
        data={fillGridRow(filteredCoaches, columns)}
        keyExtractor={(c, index) => c?.id ?? `filler-${index}`}
        numColumns={columns}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ paddingBottom: role === "club_admin" ? 80 : spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {query || venueFilter || selectedBranch ? "Eşleşen antrenör bulunamadı." : "Henüz antrenör yok."}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          if (!item) return <View style={[styles.card, styles.cardFiller]} />;
          const myBranches = coachBranches[item.id] ?? [];
          const isCoordinator = coordinatorCoachIds.has(item.id);
          const hasVenueAuthority = (coachVenueIds[item.id]?.length ?? 0) > 0;
          const accent = accentRotation[index % accentRotation.length];
          const accentSoft = accentSoftRotation[index % accentSoftRotation.length];
          return (
            <TouchableOpacity
              style={[styles.card, !item.is_active && styles.cardInactive]}
              onPress={() => navigation.navigate("CoachDetail", { coachId: item.id })}
            >
              <View style={styles.cardTopRow}>
                <Avatar
                  photoUrl={item.photo_url}
                  name={item.name}
                  gender={item.gender}
                  kind="coach"
                  size={44}
                  backgroundColor={accentSoft}
                  textColor={accent}
                />
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {!item.is_active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>PASİF</Text>
                    </View>
                  )}
                  {isCoordinator && (
                    <View style={styles.coordinatorBadge}>
                      <Text style={styles.coordinatorBadgeText}>★ KOORDİNATÖR</Text>
                    </View>
                  )}
                  {hasVenueAuthority && (
                    <View style={styles.venueAuthorityBadge}>
                      <Text style={styles.venueAuthorityBadgeText}>🏟 SALON YETKİLİSİ</Text>
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

      {/* Yeni antrenör DAVET ETMEK, kulüp geneli bir hesap oluşturma işlemi —
          "branş koordinatörü kendi branşının admini" ilkesi bunu kapsamıyor,
          koordinatör sadece kendi branşındaki antrenörleri GÖREBİLİR.
          Takvim ekranındaki sarı yuvarlak + ile aynı desen (bkz.
          TrainingSessionsScreen.tsx fab/fabIcon). */}
      {role === "club_admin" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("InviteUser", { presetRole: "coach" })}
          accessibilityLabel="Antrenör ekle"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  filterRow: { marginBottom: spacing.xs },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm,
  },
  cardFiller: { opacity: 0 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs },
  groupBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.bg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  groupBadgeText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  coordinatorBadge: {
    backgroundColor: colors.yellow, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  coordinatorBadgeText: { color: colors.bg, fontSize: 9, fontWeight: "800" },
  venueAuthorityBadge: {
    backgroundColor: colors.violet, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  venueAuthorityBadgeText: { color: colors.bg, fontSize: 9, fontWeight: "800" },
  cardName: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  branchLevelLine: { color: colors.teal, fontSize: 10, fontWeight: "600", marginTop: 2 },
  noBranchText: { color: colors.muted, fontSize: 10, marginTop: 2 },
  rowGroups: { color: colors.muted, fontSize: 10, marginTop: 4 },
  overviewButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginBottom: spacing.md,
  },
  overviewButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  fab: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.yellow,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  fabIcon: { color: colors.bg, fontSize: 28, fontWeight: "700", lineHeight: 30 },
  cardInactive: { opacity: 0.55 },
  inactiveBadge: { backgroundColor: colors.line, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  inactiveBadgeText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
});
