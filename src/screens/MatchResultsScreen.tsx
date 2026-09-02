import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listMatches, listMatchesForGroups, getMatchResult, type MatchRow } from "../lib/api/matches";
import { listBranches, type Branch } from "../lib/api/branches";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "MatchResults">;

const RESULT_LABEL: Record<string, string> = { win: "Galibiyet", draw: "Beraberlik", loss: "Mağlubiyet" };
const RESULT_COLOR: Record<string, string> = { win: colors.teal, draw: colors.yellow, loss: colors.coral };

export default function MatchResultsScreen({ navigation }: Props) {
  const { role } = useAuth();
  const isCoach = role === "coach";

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [m, b] = await Promise.all([
        isCoach ? getMyCoachedGroupIds().then(listMatchesForGroups) : listMatches(),
        listBranches(),
      ]);
      setMatches(m);
      setBranches(b);
    } catch (e: any) {
      setError(e.message ?? "Müsabakalar yüklenemedi");
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

  const individualBranchNames = useMemo(
    () => new Set(branches.filter((b) => b.is_individual).map((b) => b.name)),
    [branches]
  );

  // Önceden "tarihi bugünden ÖNCE olan" maçları gösteriyordu — bu yüzden
  // BUGÜN oynanıp aynı gün sonucu girilen bir maç hiç görünmüyordu ("<"
  // bugünü hariç tutuyordu). Asıl kriter sonuç girilmiş olması, tarih değil.
  // Bireysel branşlarda sonuç skor değil, result_note metni.
  const resultedMatches = useMemo(() => {
    let list = matches.filter((m) =>
      m.groups?.branch && individualBranchNames.has(m.groups.branch)
        ? !!m.result_note?.trim()
        : m.our_score !== null && m.opponent_score !== null
    );
    if (branchFilter) list = list.filter((m) => m.groups?.branch === branchFilter);
    return [...list].sort((a, b) => b.match_date.localeCompare(a.match_date) || b.start_time.localeCompare(a.start_time));
  }, [matches, branchFilter, individualBranchNames]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{resultedMatches.length} sonuçlanmış müsabaka</Text>

      {branches.length > 1 && (
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

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={resultedMatches}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz sonuçlanmış müsabaka yok.</Text> : null}
        renderItem={({ item }) => {
          const isIndividual = !!item.groups?.branch && individualBranchNames.has(item.groups.branch);
          const result = isIndividual ? null : getMatchResult(item);
          return (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("MatchResult", { matchId: item.id })}>
              <View style={styles.rowTop}>
                <Text style={styles.rowGroup} numberOfLines={1}>🏆 {item.groups?.name ?? "Grup atanmadı"}</Text>
                <Text style={styles.rowDate}>{item.match_date}</Text>
              </View>
              {!isIndividual && <Text style={styles.rowOpponent}>vs. {item.opponent_name}</Text>}
              {!!item.groups?.branch && <Text style={styles.rowBranch}>{item.groups.branch}</Text>}

              {isIndividual ? (
                <Text style={styles.resultNote}>{item.result_note}</Text>
              ) : (
                <View style={styles.resultRow}>
                  <Text style={styles.score}>{item.our_score} - {item.opponent_score}</Text>
                  {result && (
                    <View style={[styles.resultBadge, { backgroundColor: `${RESULT_COLOR[result]}22` }]}>
                      <Text style={[styles.resultBadgeText, { color: RESULT_COLOR[result] }]}>{RESULT_LABEL[result]}</Text>
                    </View>
                  )}
                </View>
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
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
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
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.coral,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowGroup: { color: colors.ink, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  rowDate: { color: colors.muted, fontSize: 12, marginLeft: spacing.sm },
  rowOpponent: { color: colors.muted, fontSize: 13 },
  rowBranch: { color: colors.muted, fontSize: 11, marginTop: 2 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  resultNote: { color: colors.ink, fontSize: 13, marginTop: spacing.sm, lineHeight: 18 },
  score: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  resultBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  resultBadgeText: { fontSize: 11, fontWeight: "700" },
});
