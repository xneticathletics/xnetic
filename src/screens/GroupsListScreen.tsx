import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";

// Bu ekran hem ClubSettingsStack'ten (Kulüp Ayarları) hem de HomeStack'ten
// (Ana Sayfa → Kulüp Yapısı) açılabiliyor — belirli bir stack'in
// ParamList'ine bağlanmak yerine sadece ihtiyaç duyduğu navigation
// şeklini bekliyor. Böylece hangi sekmeden açıldıysa geri tuşu/alt menü
// vurgusu da o sekmede kalıyor (çapraz-sekme geçişte olduğu gibi
// "Kulüp Ayarları" sekmesine atlamıyor).
type Props = { navigation: NativeStackNavigationProp<any> };

export default function GroupsListScreen({ navigation }: Props) {
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
    const byBranch: Record<string, Group[]> = {};
    groups.forEach((g) => {
      (byBranch[g.branch] ??= []).push(g);
    });
    return Object.entries(byBranch)
      .sort(([a], [b]) => a.localeCompare(b, "tr"))
      .map(([branch, groupsInBranch]) => ({
        branch,
        groupsInBranch: [...groupsInBranch].sort((x, y) => x.name.localeCompare(y.name, "tr")),
      }));
  }, [groups]);

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

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
      >
        {sections.map(({ branch, groupsInBranch }) => (
          <View key={branch} style={{ marginBottom: spacing.md }}>
            <View style={styles.branchHeaderRow}>
              <View style={styles.branchHeaderBar} />
              <Text style={styles.branchHeaderText}>{branch}</Text>
            </View>
            <View style={styles.grid}>
              {groupsInBranch.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => navigation.navigate("GroupForm", { groupId: item.id })}
                >
                  <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  card: {
    width: "23%", minHeight: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: 6, alignItems: "center", justifyContent: "center",
  },
  cardName: { color: colors.ink, fontSize: 11, fontWeight: "700", textAlign: "center" },
});
