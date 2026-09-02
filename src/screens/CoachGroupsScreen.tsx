import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";
import {
  getCoach, getCoachAssignments, setCoachAssignment, deactivateCoach,
  getCoachBranches, getGroupStaffingMap, type Coach, type CoachBranchInfo, type GroupAssignment, type GroupStaffing,
} from "../lib/api/coaches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachGroups">;

const OPTIONS: { value: GroupAssignment; label: string }[] = [
  { value: "none", label: "Yok" },
  { value: "head", label: "Baş Antrenör" },
  { value: "assistant", label: "Yardımcı" },
];

export default function CoachGroupsScreen({ route, navigation }: Props) {
  const { coachId, coachName } = route.params;
  const { selectedBranch } = useBranchSelect();
  const { settings } = useClubSettings();

  const [coach, setCoach] = useState<Coach | null>(null);
  const [myBranches, setMyBranches] = useState<CoachBranchInfo[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Record<string, GroupAssignment>>({});
  const [staffing, setStaffing] = useState<Record<string, GroupStaffing>>({});
  const [loading, setLoading] = useState(true);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [c, cb, g, a, s] = await Promise.all([
        getCoach(coachId), getCoachBranches(coachId), listGroups(), getCoachAssignments(coachId), getGroupStaffingMap(),
      ]);
      setCoach(c);
      setMyBranches(cb);
      setGroups(g);
      setAssignments(a);
      setStaffing(s);
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [coachId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleSelect = async (groupId: string, value: GroupAssignment) => {
    setSavingGroupId(groupId);
    try {
      await setCoachAssignment(coachId, groupId, value);
      setAssignments((prev) => ({ ...prev, [groupId]: value }));
      // Kadro (kim çalışıyor) değişmiş olabilir — tazele.
      setStaffing(await getGroupStaffingMap());
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSavingGroupId(null);
    }
  };

  const handleRemoveCoach = () => {
    Alert.alert(
      "Antrenörü kulüpten çıkar",
      `${coachName} kulüpten çıkarılacak ve tüm grup atamaları kaldırılacak. Hesabı tamamen silmiyoruz — istersen ileride tekrar aktifleştirebilirsin. Devam etmek istiyor musun?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kulüpten Çıkar",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateCoach(coachId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "İşlem başarısız", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  // Antrenörün uzman olduğu branş(lar)a göre daralt — henüz hiç branş
  // atanmadıysa grup listesi boş kalır (tüm branşların grupları karışık
  // görünmesin diye), Admin'in Ana Sayfa'da seçtiği branşa göre de ayrıca
  // daraltılır.
  const myBranchNames = new Set(myBranches.map((b) => b.branch_name));
  const visibleGroups = myBranchNames.size === 0 ? [] : groups.filter((g) => {
    if (selectedBranch && g.branch !== selectedBranch) return false;
    return myBranchNames.has(g.branch);
  });

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        style={{ flex: 1 }}
        data={visibleGroups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {myBranchNames.size > 0
                ? "Yukarıda seçtiğin branş(lar)da hiç grup yok."
                : "Görevlendirme yapabilmek için önce Branş ve Belge İşlemleri'nden bir branş seç."}
            </Text>
          ) : null
        }
        ListHeaderComponent={
          <>
            <View style={styles.infoCard}>
              {coach?.photo_url ? (
                <Image source={{ uri: coach.photo_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{coachName.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{coachName}</Text>
                {!!coach?.phone && <Text style={styles.infoLine}>📞 {coach.phone}</Text>}
                {!!coach?.email && <Text style={styles.infoLine}>✉️ {coach.email}</Text>}
              </View>
            </View>

            <Text style={styles.subtitle}>
              {myBranchNames.size > 0
                ? "Sadece uzman olduğun branş(lar)ın grupları gösteriliyor"
                : "Görevlendirme yapabilmek için önce Branş ve Belge İşlemleri'nden bir branş seç"}
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const current = assignments[item.id] ?? "none";
          const isSaving = savingGroupId === item.id;
          const s = staffing[item.id];
          const assistantCount = s?.assistantNames.length ?? 0;
          return (
            <View style={styles.groupRow}>
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupBranch}>{item.branch}</Text>
                <View style={styles.staffingBox}>
                  <Text style={styles.staffingLine}>
                    <Text style={styles.staffingLabel}>Baş Antrenör: </Text>
                    {s?.headName ?? "Boş"}
                  </Text>
                  <Text style={styles.staffingLine}>
                    <Text style={styles.staffingLabel}>Yardımcı ({assistantCount}/{settings.assistant_coach_limit}): </Text>
                    {assistantCount > 0 ? s!.assistantNames.join(", ") : "Boş"}
                  </Text>
                </View>
              </View>
              <View style={styles.chipsRow}>
                {OPTIONS.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => handleSelect(item.id, opt.value)}
                      disabled={isSaving}
                    >
                      {isSaving && active ? (
                        <ActivityIndicator size="small" color={colors.bg} />
                      ) : (
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.removeButton} onPress={handleRemoveCoach}>
        <Text style={styles.removeButtonText}>Antrenörü Kulüpten Çıkar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  avatar: {
    width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.yellowSoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 56, height: 56, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 20, fontWeight: "800" },
  infoLine: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  groupRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  groupName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  groupBranch: { color: colors.muted, fontSize: 12, marginTop: 2 },
  staffingBox: { marginTop: spacing.sm, gap: 2 },
  staffingLine: { color: colors.ink, fontSize: 12 },
  staffingLabel: { color: colors.muted, fontWeight: "600" },
  chipsRow: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, minWidth: 70, alignItems: "center",
  },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: colors.bg },
  removeButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl,
  },
  removeButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
