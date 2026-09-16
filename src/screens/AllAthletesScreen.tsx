import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";
import { listGroups, type Group } from "../lib/api/groups";
import { listBranches, type Branch } from "../lib/api/branches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useResponsiveColumns, fillGridRow } from "../hooks/useResponsiveColumns";
import Avatar from "../components/Avatar";
import FilterChipRow from "../components/FilterChipRow";

type Props = NativeStackScreenProps<HomeStackParamList, "AllAthletes">;

export default function AllAthletesScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { selectedBranch, isLocked } = useBranchSelect();
  const columns = useResponsiveColumns(2);

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string | null>(isLocked ? selectedBranch : null);
  const [typeFilter, setTypeFilter] = useState<"all" | "spor_okulu" | "musabik">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [a, g, b] = await Promise.all([listAllAthletes(), listGroups(), listBranches()]);
      setAthletes(a);
      setGroups(g);
      setBranches(b);
    } catch (e: any) {
      setError(e.message ?? "Sporcular yüklenemedi");
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

  // Bir sporcunun grubu üzerinden hangi branşa ait olduğunu bulmak için.
  const branchByGroupId = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach((g) => { map[g.id] = g.branch; });
    return map;
  }, [groups]);

  // Grup grup sıralama için gruplara sıra numarası veriyoruz — branşa, sonra
  // grup adına göre (groups zaten API'den ada göre sıralı geliyor, burada
  // sadece branşı da öne alıyoruz ki aynı branştaki gruplar bitişik dursun).
  const groupOrderIndex = useMemo(() => {
    const ordered = [...groups].sort((a, b) => {
      const branchCmp = a.branch.localeCompare(b.branch, "tr");
      return branchCmp !== 0 ? branchCmp : a.name.localeCompare(b.name, "tr");
    });
    const map: Record<string, number> = {};
    ordered.forEach((g, i) => { map[g.id] = i; });
    return map;
  }, [groups]);

  const filtered = useMemo(() => {
    let list = athletes;
    if (branchFilter) {
      list = list.filter((a) => a.group_id && branchByGroupId[a.group_id] === branchFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((a) => a.athlete_type === typeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => a.full_name.toLowerCase().includes(q));
    }
    // Grup grup sırala (grubu olmayanlar en sona) — aynı grup içinde A'dan Z'ye.
    return [...list].sort((x, y) => {
      const xOrder = x.group_id != null ? groupOrderIndex[x.group_id] ?? Infinity : Infinity;
      const yOrder = y.group_id != null ? groupOrderIndex[y.group_id] ?? Infinity : Infinity;
      if (xOrder !== yOrder) return xOrder - yOrder;
      return x.full_name.localeCompare(y.full_name, "tr");
    });
  }, [athletes, branchFilter, typeFilter, query, branchByGroupId, groupOrderIndex]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{filtered.length} sporcu — Gruba göre</Text>

      {!isLocked && branches.length > 1 && (
        <FilterChipRow
          options={[{ key: null, label: "Tüm Branşlar" }, ...branches.map((b) => ({ key: b.name, label: b.name }))]}
          activeKey={branchFilter}
          onSelect={setBranchFilter}
          style={styles.filterRow}
          showScrollHint
        />
      )}

      <TextInput
        style={styles.search}
        placeholder="Sporcu ara..."
        placeholderTextColor={colors.muted}
        accessibilityLabel="Sporcu ara"
        value={query}
        onChangeText={setQuery}
      />

      <FilterChipRow
        options={[
          { key: "all", label: "Tümü" },
          { key: "spor_okulu", label: "Spor Okulu" },
          { key: "musabik", label: "🏆 Müsabık" },
        ]}
        activeKey={typeFilter}
        onSelect={(key) => setTypeFilter(key as "all" | "spor_okulu" | "musabik")}
        activeColor={colors.teal}
        style={styles.filterRow}
        showScrollHint
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        key={`cols-${columns}`}
        data={fillGridRow(filtered, columns)}
        keyExtractor={(a, index) => a?.id ?? `filler-${index}`}
        numColumns={columns}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Eşleşen sporcu bulunamadı.</Text> : null}
        renderItem={({ item }) => {
          if (!item) return <View style={[styles.row, styles.rowFiller]} />;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("AthleteDetail", { athleteId: item.id })}
            >
              <Avatar photoUrl={item.photo_url} name={item.full_name} gender={item.gender} kind="athlete" size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{item.groups?.name ?? "Grup atanmadı"}</Text>
                {item.athlete_type === "musabik" && <Text style={styles.musabikTag}>🏆 Müsabık</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 0, marginBottom: spacing.sm },
  filterRow: { marginBottom: spacing.sm },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.sm,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: spacing.sm,
  },
  rowFiller: { opacity: 0 },
  rowName: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 1 },
  musabikTag: { color: colors.yellow, fontSize: 10, fontWeight: "700", marginTop: 2 },
});
