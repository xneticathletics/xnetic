import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";
import { listBranches, type Branch } from "../lib/api/branches";
import { getMonthlyFinanceSummary, type MonthlyFinanceSummary } from "../lib/api/payments";
import { useClubSettings } from "../context/ClubSettingsContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useBranchSelect } from "../context/BranchSelectContext";

type Props = NativeStackScreenProps<HomeStackParamList, "PaymentGroups">;

export default function PaymentGroupsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { selectedBranch: globalBranch, isLocked } = useBranchSelect();
  const { settings } = useClubSettings();

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string | null>(isLocked ? globalBranch : null);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [summary, setSummary] = useState<MonthlyFinanceSummary | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya/bu ekrana her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          const [g, b, a, s] = await Promise.all([
            listGroups(), listBranches(), listAllAthletes(), getMonthlyFinanceSummary(settings.payment_overdue_grace_days),
          ]);
          if (!cancelled) {
            setAllGroups(g);
            setBranches(b);
            setAllAthletes(a);
            setSummary(s);
          }
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [settings.payment_overdue_grace_days])
  );

  const formatTL = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

  const groups = useMemo(
    () => (branchFilter ? allGroups.filter((g) => g.branch === branchFilter) : allGroups),
    [allGroups, branchFilter]
  );

  const searching = query.trim().length > 0;
  // Klavye açıldığında (arama kutusuna dokunulduğunda) üstteki butonlar,
  // özet kart ve döküman linki gizlenir — aksi halde sonuç listesine
  // klavyenin altında neredeyse hiç yer kalmıyordu.
  const collapseChrome = searchFocused || searching;
  const branchGroupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const filteredAthletes = allAthletes.filter((a) => {
    if (!a.full_name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (branchFilter) return !!a.group_id && branchGroupIds.has(a.group_id);
    return true;
  });

  return (
    <View style={styles.container}>
      {!collapseChrome && (
        <>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.incomeButton} onPress={() => navigation.navigate("IncomeForm")}>
              <Text style={styles.incomeButtonText}>+ Gelir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.expenseButton} onPress={() => navigation.navigate("ExpenseForm")}>
              <Text style={styles.expenseButtonText}>+ Gider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.coachPaymentsButton} onPress={() => navigation.navigate("CoachPayments")}>
              <Text style={styles.coachPaymentsButtonText}>Antrenör Ödemeleri</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("PaymentForm", {})}>
              <Text style={styles.addButtonText}>+ Aidat Planı</Text>
            </TouchableOpacity>
          </View>

          {summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Toplam Aidat Durumu</Text>
              <Text style={styles.summaryExpected}>{formatTL(summary.expected)}</Text>
              <View style={styles.summaryRow}>
                <TouchableOpacity style={[styles.statBox, { borderColor: colors.teal }]} onPress={() => navigation.navigate("PaymentsList", { filter: "paid" })}>
                  <View style={styles.statBoxHeader}>
                    <Text style={styles.summarySubLabel}>Tahsil Edilen</Text>
                    <Text style={[styles.statBoxArrow, { color: colors.teal }]}>›</Text>
                  </View>
                  <Text style={[styles.summarySubValue, { color: colors.teal }]}>{formatTL(summary.collected)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statBox, { borderColor: colors.yellow }]} onPress={() => navigation.navigate("PaymentsList", { filter: "pending" })}>
                  <View style={styles.statBoxHeader}>
                    <Text style={styles.summarySubLabel}>Bekleyen</Text>
                    <Text style={[styles.statBoxArrow, { color: colors.yellow }]}>›</Text>
                  </View>
                  <Text style={[styles.summarySubValue, { color: colors.yellow }]}>{formatTL(summary.pending)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statBox, { borderColor: colors.coral }]} onPress={() => navigation.navigate("PaymentsList", { filter: "overdue" })}>
                  <View style={styles.statBoxHeader}>
                    <Text style={styles.summarySubLabel}>Vadesi Geçmiş</Text>
                    <Text style={[styles.statBoxArrow, { color: colors.coral }]}>›</Text>
                  </View>
                  <Text style={[styles.summarySubValue, { color: colors.coral }]}>{formatTL(summary.overdue)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.docsButton} onPress={() => navigation.navigate("FinancialDocuments")}>
            <Text style={styles.docsButtonText}>📄 Finansal Dökümanlarımı Listele</Text>
            <Text style={styles.docsButtonArrow}>›</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.search, { flex: 1 }]}
          placeholder="Sporcu ara..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearSearchButton} onPress={() => setQuery("")}>
            <Text style={styles.clearSearchButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {!collapseChrome && !isLocked && branches.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ alignItems: "center" }}
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

      {searching ? (
        <FlatList
          key="search-list"
          data={filteredAthletes}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>Sporcu bulunamadı.</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("AthletePayments", { athleteId: item.id, athleteName: item.full_name })}
            >
              <Text style={styles.rowName}>{item.full_name}</Text>
              <Text style={styles.rowSub}>{item.groups?.name ?? "Grup atanmadı"}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          key="grid-list"
          data={groups}
          keyExtractor={(g) => g.id}
          numColumns={4}
          columnWrapperStyle={{ gap: spacing.xs }}
          contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.xs }}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz grup yok.</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("PaymentAthletes", { groupId: item.id, groupName: item.name })}
            >
              <Text style={styles.gridCardName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.gridCardSub} numberOfLines={1}>{item.branch}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  headerActions: { flexDirection: "row", gap: 4, marginBottom: spacing.md },
  addButton: { flex: 1, backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: 2, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 10, textAlign: "center" },
  incomeButton: { flex: 1, borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm, paddingHorizontal: 2, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  incomeButtonText: { color: colors.teal, fontWeight: "700", fontSize: 10, textAlign: "center" },
  expenseButton: { flex: 1, borderWidth: 1, borderColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: 2, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  expenseButtonText: { color: colors.coral, fontWeight: "700", fontSize: 10, textAlign: "center" },
  coachPaymentsButton: { flex: 1, borderWidth: 1, borderColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: 2, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  coachPaymentsButtonText: { color: colors.violet, fontWeight: "700", fontSize: 10, textAlign: "center" },
  summaryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  docsButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, marginBottom: spacing.md,
  },
  docsButtonText: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  docsButtonArrow: { color: colors.muted, fontSize: 18, fontWeight: "700" },
  summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  summaryExpected: { color: colors.yellow, fontSize: 26, fontWeight: "800", marginTop: 4, marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  statBox: {
    flex: 1, borderWidth: 1, borderRadius: radius.md, backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, alignItems: "center",
  },
  statBoxHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  statBoxArrow: { fontSize: 13, fontWeight: "800", lineHeight: 14 },
  summarySubLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", textAlign: "center" },
  summarySubValue: { fontSize: 16, fontWeight: "700", marginTop: 2, textAlign: "center" },
  searchRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  clearSearchButton: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center",
  },
  clearSearchButtonText: { color: colors.muted, fontSize: 16, fontWeight: "700" },
  filterRow: { flexDirection: "row", marginBottom: spacing.md, height: 32, flexGrow: 0, flexShrink: 0 },
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
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  gridCard: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: spacing.xs, minHeight: 64, justifyContent: "center",
  },
  gridCardName: { color: colors.ink, fontSize: 11, fontWeight: "700", textAlign: "center" },
  gridCardSub: { color: colors.muted, fontSize: 9, marginTop: 3, textAlign: "center" },
});
