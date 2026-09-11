import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useResponsiveColumns } from "../hooks/useResponsiveColumns";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Bu ekran hem ClubSettingsStack'ten (Kulüp Ayarları) hem de HomeStack'ten
// (Ana Sayfa → Kulüp Yapısı) açılabiliyor — belirli bir stack'in
// ParamList'ine bağlanmak yerine sadece ihtiyaç duyduğu navigation
// şeklini bekliyor. Böylece hangi sekmeden açıldıysa geri tuşu/alt menü
// vurgusu da o sekmede kalıyor (çapraz-sekme geçişte olduğu gibi
// "Kulüp Ayarları" sekmesine atlamıyor).
type Props = { navigation: NativeStackNavigationProp<any> };

export default function GroupsListScreen({ navigation }: Props) {
  const { role } = useAuth();
  const { selectedBranch, isLocked } = useBranchSelect();
  // Branş koordinatörü Kulüp Yapısı'nda SADECE kendi branşının gruplarını
  // görür ve YÖNETEBİLİR (ekle/düzenle/sil) — RLS zaten groups_coordinator_write/
  // update/delete ile bunu kendi branşıyla sınırlıyor (is_my_coordinator_branch/
  // is_my_coordinated_group). Salonlar bunun aksine hâlâ salt okunur, branşlar
  // hiç gösterilmiyor (bkz. VenuesListScreen.tsx / ClubStructureScreen.tsx).
  const isCoordinator = role === "coach" && isLocked;
  const columns = useResponsiveColumns(4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setGroups(await listGroups());
    } catch (e: any) {
      setError(e.message ?? "Gruplar yüklenemedi");
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

  // Branş branş grupla — her branşın altında kendi grupları, alfabetik
  // sırayla, küçük başlıklarla ayrılmış.
  const sections = useMemo(() => {
    const scoped = isCoordinator ? groups.filter((g) => g.branch === selectedBranch) : groups;
    const byBranch: Record<string, Group[]> = {};
    scoped.forEach((g) => {
      (byBranch[g.branch] ??= []).push(g);
    });
    return Object.entries(byBranch)
      .sort(([a], [b]) => a.localeCompare(b, "tr"))
      .map(([branch, groupsInBranch]) => ({
        branch,
        groupsInBranch: [...groupsInBranch].sort((x, y) => x.name.localeCompare(y.name, "tr")),
      }));
  }, [groups, isCoordinator, selectedBranch]);

  // SectionList sanallaştırması için her branşın grid'i satırlara (chunk)
  // bölünüyor — her renderItem çağrısı tek bir satırı (columns kadar kart)
  // render ediyor, ScrollView+.map() ile TÜM kartları aynı anda mount
  // etmek yerine.
  const listSections = useMemo(
    () => sections.map(({ branch, groupsInBranch }) => ({ title: branch, data: chunk(groupsInBranch, columns) })),
    [sections, columns]
  );
  const cardWidthPercent = `${100 / columns - 2}%` as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("GroupForm", { groupId: undefined })}>
          <Text style={styles.addButtonText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && sections.length === 0 && <Text style={styles.empty}>Henüz grup eklenmemiş.</Text>}

      <SectionList
        sections={listSections}
        keyExtractor={(row) => row.map((g) => g.id).join("-")}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.branchHeaderRow}>
            <View style={styles.branchHeaderBar} />
            <Text style={styles.branchHeaderText}>{section.title}</Text>
          </View>
        )}
        renderSectionFooter={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item: row }) => (
          <View style={styles.grid}>
            {row.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { width: cardWidthPercent }]}
                onPress={() => navigation.navigate("GroupForm", { groupId: item.id })}
              >
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  branchHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  branchHeaderBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  branchHeaderText: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  grid: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs },
  card: {
    minHeight: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: 6, alignItems: "center", justifyContent: "center",
  },
  cardName: { color: colors.ink, fontSize: 11, fontWeight: "700", textAlign: "center" },
});
