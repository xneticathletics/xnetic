import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { listFitnessGroups, deleteFitnessGroup, type FitnessGroupSummary } from "../lib/api/fitnessGroups";
import { listMyCoachedGroups } from "../lib/api/groups";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessGroups">;

// Normal antrenman/yoklama gruplarından (GroupsListScreen) tamamen bağımsız
// — bir branştaki tüm müsabık sporculardan serbestçe seçilmiş, sadece
// fitness programı ataması için kullanılan özel kümeler. Fitness sayfasının
// (FitnessScreen) alt ekranı olduğu için (Ana Sayfa'dan doğrudan açılmıyor)
// useHomeButton KULLANILMIYOR — normal geri oku Fitness'a döner.
export default function FitnessGroupsScreen({ navigation }: Props) {
  const { role } = useAuth();
  const { isLocked } = useBranchSelect();
  const isCoach = role === "coach";
  // Silme sadece club_admin ve branş koordinatörüne açık — sıradan
  // antrenör bir fitness grubunu artık silemez.
  const canDelete = role === "club_admin" || (role === "coach" && isLocked);
  const [groups, setGroups] = useState<FitnessGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Antrenör (branş koordinatörü dahil) sadece kendi branşındaki fitness
  // gruplarını görsün/yönetsin — başka branşların gruplarını ne listede
  // görmeli ne de açabilmeli. club_admin hâlâ hepsini görür.
  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await listFitnessGroups();
      if (!isCoach) {
        setGroups(all);
        return;
      }
      const myGroups = await listMyCoachedGroups();
      const myBranches = new Set(myGroups.map((g) => g.branch));
      setGroups(all.filter((g) => myBranches.has(g.branch)));
    } catch (e: any) {
      setError(e.message ?? "Fitness grupları yüklenemedi");
    }
  }, [isCoach]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const handleDelete = (group: FitnessGroupSummary) => {
    Alert.alert("Fitness Grubunu Sil", `"${group.name}" fitness grubunu silmek istediğine emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFitnessGroup(group.id);
            load();
          } catch (e: any) {
            Alert.alert("Silinemedi", e.message ?? "Bilinmeyen hata", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Bir branştaki tüm müsabık sporculardan istediklerini seçip özel bir fitness grubu oluşturabilirsin.
      </Text>

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("FitnessGroupForm", undefined)}>
        <Text style={styles.addButtonText}>+ Fitness Grubu Ekle</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        style={{ flex: 1 }}
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz fitness grubu yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              onPress={() => navigation.navigate("FitnessGroupForm", { fitnessGroupId: item.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>🎯 {item.name}</Text>
                <Text style={styles.cardSub}>{item.branch} · {item.member_count} sporcu</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            {canDelete && (
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                accessibilityLabel={`${item.name} grubunu sil`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: spacing.sm }}
              >
                <Text style={styles.cardDeleteIcon}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.md, lineHeight: 17 },
  addButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14,
    alignItems: "center", marginBottom: spacing.lg,
  },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.yellow, fontSize: 20, fontWeight: "700" },
  cardDeleteIcon: { fontSize: 16 },
});
