import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";
import { listGroups, type Group } from "../lib/api/groups";
import { listBranches, type Branch } from "../lib/api/branches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useBranchSelect } from "../context/BranchSelectContext";

type Props = NativeStackScreenProps<HomeStackParamList, "AllAthletes">;

export default function AllAthletesScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { selectedBranch, isLocked } = useBranchSelect();

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
    // A'dan Z'ye sırala.
    return [...list].sort((x, y) => x.full_name.localeCompare(y.full_name, "tr"));
  }, [athletes, branchFilter, typeFilter, query, branchByGroupId]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{filtered.length} sporcu — A'dan Z'ye</Text>

      {!isLocked && branches.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          <TouchableOpacity
            style={[styles.chip, !branchFilter && styles.chipActive]}
            onPress={() => setBranchFilter(null)}
          >
            <Text style={[styles.chipText, !branchFilter && styles.chipTextActive]}>Tüm Branşlar</Text>
          </TouchableOpacity>
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.chip, branchFilter === b.name && styles.chipActive]}
              onPress={() => setBranchFilter(b.name)}
            >
              <Text style={[styles.chipText, branchFilter === b.name && styles.chipTextActive]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TextInput
        style={styles.search}
        placeholder="Sporcu ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.typeFilterRow}>
        {(["all", "spor_okulu", "musabik"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, typeFilter === t && styles.typeChipActive]}
            onPress={() => setTypeFilter(t)}
          >
            <Text style={[styles.typeChipText, typeFilter === t && styles.typeChipTextActive]} numberOfLines={1}>
              {t === "all" ? "Tümü" : t === "spor_okulu" ? "Spor Okulu" : "🏆 Müsabık"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Eşleşen sporcu bulunamadı.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("AthleteDetail", { athleteId: item.id })}
          >
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{item.groups?.name ?? "Grup atanmadı"}</Text>
              {item.athlete_type === "musabik" && <Text style={styles.musabikTag}>🏆 Müsabık</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 0, marginBottom: spacing.sm },
  filterRow: { height: 32, marginBottom: spacing.md, flexGrow: 0, flexShrink: 0 },
  filterRowContent: { flexDirection: "row", alignItems: "center" },
  chip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, marginRight: spacing.xs,
    alignItems: "center", justifyContent: "center", height: 28, flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  chipTextActive: { color: colors.bg },
  typeFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  typeChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, height: 28, alignItems: "center", justifyContent: "center",
  },
  typeChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  typeChipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  typeChipTextActive: { color: colors.bg },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: spacing.sm,
  },
  avatar: {
    width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 40, height: 40, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  rowName: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 1 },
  musabikTag: { color: colors.yellow, fontSize: 10, fontWeight: "700", marginTop: 2 },
});
