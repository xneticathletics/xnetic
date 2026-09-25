import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listMatches, listMatchesForGroups, deleteMatches, getMatchResult, type MatchRow } from "../lib/api/matches";
import { listBranches, type Branch } from "../lib/api/branches";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import DatePickerModal from "../components/DatePickerModal";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "MatchResults">;

const RESULT_LABEL: Record<string, string> = { win: "Galibiyet", draw: "Beraberlik", loss: "Mağlubiyet" };
const RESULT_COLOR: Record<string, string> = { win: colors.teal, draw: colors.yellow, loss: colors.coral };

function formatDate(iso: string | null) {
  if (!iso) return "Seçilmedi";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default function MatchResultsScreen({ navigation }: Props) {
  const { role } = useAuth();
  const { isLocked: isBranchCoordinator } = useBranchSelect();
  const isCoach = role === "coach";
  // Silme yetkisi MatchFormScreen'deki tekli silmeyle AYNI kural — RLS
  // aslında bir grubu koçlayan HERKESE izin veriyor ama bu ekranda da
  // (kullanıcı isteği: toplu silme) yetkiyi daha yukarıda tutuyoruz.
  const canDelete = role === "club_admin" || (isCoach && isBranchCoordinator);

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<"start" | "end" | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uzun bas → çoklu seç → üstte "Sil" çıkar (kullanıcı isteği). Bir maça
  // kısa dokunuş normalde detaya götürür; seçim modundayken kısa dokunuş
  // da seçimi aç/kapatır — ikinci bir uzun basışa gerek kalmadan.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectionMode = selectedIds.size > 0;
  const [deleting, setDeleting] = useState(false);

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
      setSelectedIds(new Set());
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
    if (startDate) list = list.filter((m) => m.match_date >= startDate);
    if (endDate) list = list.filter((m) => m.match_date <= endDate);
    return [...list].sort((a, b) => b.match_date.localeCompare(a.match_date) || b.start_time.localeCompare(a.start_time));
  }, [matches, branchFilter, startDate, endDate, individualBranchNames]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert(
      "Müsabakaları sil",
      `${count} müsabaka sonucu kalıcı olarak silinecek. Emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteMatches(Array.from(selectedIds));
              setSelectedIds(new Set());
              await load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {selectionMode ? (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={() => setSelectedIds(new Set())}>
            <Text style={styles.selectionCancel}>Vazgeç</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedIds.size} seçili</Text>
          <TouchableOpacity style={styles.selectionDeleteButton} onPress={handleDeleteSelected} disabled={deleting}>
            {deleting ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.selectionDeleteText}>🗑 Sil</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.subtitle}>{resultedMatches.length} sonuçlanmış müsabaka</Text>
      )}

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

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateChip} onPress={() => setPickerOpen("start")}>
          <Text style={styles.dateChipLabel}>Başlangıç</Text>
          <Text style={styles.dateChipValue}>{formatDate(startDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateChip} onPress={() => setPickerOpen("end")}>
          <Text style={styles.dateChipLabel}>Bitiş</Text>
          <Text style={styles.dateChipValue}>{formatDate(endDate)}</Text>
        </TouchableOpacity>
        {(startDate || endDate) && (
          <TouchableOpacity style={styles.clearButton} onPress={() => { setStartDate(null); setEndDate(null); }}>
            <Text style={styles.clearButtonText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

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
          const isSelected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => {
                if (selectionMode) toggleSelect(item.id);
                else navigation.navigate("MatchResult", { matchId: item.id });
              }}
              onLongPress={() => {
                if (canDelete) toggleSelect(item.id);
              }}
            >
              <View style={styles.rowTop}>
                <View style={styles.rowTitleGroup}>
                  {selectionMode && (
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                  )}
                  <Text style={styles.rowGroup} numberOfLines={1}>🏆 {item.groups?.name ?? "Grup atanmadı"}</Text>
                </View>
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

      <DatePickerModal
        visible={pickerOpen !== null}
        selectedDate={pickerOpen === "start" ? startDate : endDate}
        onSelect={(d) => (pickerOpen === "start" ? setStartDate(d) : setEndDate(d))}
        onClose={() => setPickerOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 0, marginBottom: spacing.sm },
  selectionBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.sm, height: 32,
  },
  selectionCancel: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  selectionCount: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  selectionDeleteButton: {
    backgroundColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: spacing.md,
    paddingVertical: 6, minWidth: 70, alignItems: "center", justifyContent: "center",
  },
  selectionDeleteText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
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
  dateRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  dateChip: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  dateChipLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  dateChipValue: { color: colors.ink, fontSize: 13, fontWeight: "600", marginTop: 2 },
  clearButton: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  clearButtonText: { color: colors.coral, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.coral,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.yellow, borderWidth: 2, backgroundColor: `${colors.yellow}11` },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowTitleGroup: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  checkboxMark: { color: colors.bg, fontSize: 12, fontWeight: "800" },
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
