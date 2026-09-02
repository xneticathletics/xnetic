import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";
import { listVenues, type Venue } from "../lib/api/venues";
import {
  listCoaches, getAllCoachBranches, getGroupStaffingDetailed, setCoachAssignment,
  type Coach, type CoachBranchInfo, type GroupStaffingDetailed,
} from "../lib/api/coaches";
import CoachPickerModal from "../components/CoachPickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachesOverview">;

type Slot = { groupId: string; groupBranch: string; kind: "head" | "assistant"; currentCoachId: string | null };

export default function CoachesOverviewScreen({}: Props) {
  const { selectedBranch } = useBranchSelect();
  const { settings } = useClubSettings();
  const [groups, setGroups] = useState<Group[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachBranches, setCoachBranches] = useState<Record<string, CoachBranchInfo[]>>({});
  const [staffing, setStaffing] = useState<Record<string, GroupStaffingDetailed>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [g, v, c, cb, s] = await Promise.all([
        listGroups(), listVenues(), listCoaches(), getAllCoachBranches(), getGroupStaffingDetailed(),
      ]);
      setGroups(g);
      setVenues(v);
      setCoaches(c);
      setCoachBranches(cb);
      setStaffing(s);
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handlePick = async (coachId: string | null) => {
    if (!activeSlot) return;
    const { groupId, kind, currentCoachId } = activeSlot;
    setSavingKey(`${groupId}-${kind}-${currentCoachId ?? "new"}`);
    try {
      if (coachId === null) {
        // Boşalt: o slotta kim varsa onu "none" yap.
        if (currentCoachId) await setCoachAssignment(currentCoachId, groupId, "none");
      } else {
        await setCoachAssignment(coachId, groupId, kind);
      }
      setStaffing(await getGroupStaffingDetailed());
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSavingKey(null);
    }
  };

  // Ana Sayfa'da seçilen branşa göre daralt — tek branşlı kulüplerde
  // selectedBranch hep null olduğu için tüm gruplar görünmeye devam eder.
  const visibleGroups = selectedBranch ? groups.filter((g) => g.branch === selectedBranch) : groups;

  // Branş branş grupla — her branşın altında kendi grupları, alfabetik
  // sırayla. Zaten tek branş görünüyorsa (filtre uygulanmış ya da kulüp
  // tek branşlıysa) tek bir bölüm olarak görünür.
  const sections = useMemo(() => {
    const byBranch: Record<string, Group[]> = {};
    visibleGroups.forEach((g) => {
      (byBranch[g.branch] ??= []).push(g);
    });
    return Object.entries(byBranch)
      .sort(([a], [b]) => a.localeCompare(b, "tr"))
      .map(([branch, groupsInBranch]) => ({ branch, groupsInBranch }));
  }, [visibleGroups]);

  const renderGroupCard = (item: Group) => {
    const s = staffing[item.id] ?? { headCoachId: null, headCoachName: null, assistants: [] };
    const venueName = item.venue_id ? venues.find((v) => v.id === item.venue_id)?.name : null;

    return (
      <View key={item.id} style={styles.groupCard}>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.groupBranch} numberOfLines={1}>{venueName ?? "Salon atanmadı"}</Text>

        <TouchableOpacity
          style={styles.slotRow}
          onPress={() => setActiveSlot({ groupId: item.id, groupBranch: item.branch, kind: "head", currentCoachId: s.headCoachId })}
        >
          <Text style={styles.slotLabel}>B</Text>
          <Text style={s.headCoachName ? styles.slotValue : styles.slotValueEmpty} numberOfLines={1}>
            {s.headCoachName ?? "Ata"}
          </Text>
        </TouchableOpacity>

        {/* Yardımcı Antrenör kutucukları artık Gelişmiş Ayarlar'daki
            limite göre dinamik sayıda üretilir (sabit 2 değil). */}
        {Array.from({ length: settings.assistant_coach_limit }, (_, i) => {
          const assistant = s.assistants[i] ?? null;
          return (
            <TouchableOpacity
              key={i}
              style={styles.slotRow}
              onPress={() =>
                setActiveSlot({
                  groupId: item.id,
                  groupBranch: item.branch,
                  kind: "assistant",
                  currentCoachId: assistant?.id ?? null,
                })
              }
            >
              <Text style={styles.slotLabel}>Y{i + 1}</Text>
              <Text style={assistant ? styles.slotValue : styles.slotValueEmpty} numberOfLines={1}>
                {assistant?.name ?? "Ata"}
              </Text>
            </TouchableOpacity>
          );
        })}

        {savingKey?.startsWith(item.id) && <ActivityIndicator size="small" color={colors.yellow} style={{ marginTop: 2 }} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Tüm gruplar ve görevli antrenörleri — dokunarak ata/değiştir</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && sections.length === 0 && <Text style={styles.empty}>Henüz grup yok.</Text>}

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {sections.map(({ branch, groupsInBranch }) => (
          <View key={branch} style={{ marginBottom: spacing.md }}>
            <View style={styles.branchHeaderRow}>
              <View style={styles.branchHeaderBar} />
              <Text style={styles.branchHeaderText}>{branch}</Text>
            </View>
            <View style={styles.branchGrid}>
              {groupsInBranch.map((g) => renderGroupCard(g))}
            </View>
          </View>
        ))}
      </ScrollView>

      <CoachPickerModal
        visible={!!activeSlot}
        title={
          activeSlot
            ? `${activeSlot.kind === "head" ? "Baş Antrenör" : "Yardımcı Antrenör"} Seç (${activeSlot.groupBranch})`
            : ""
        }
        coaches={
          activeSlot
            ? coaches.filter((c) => (coachBranches[c.id] ?? []).some((b) => b.branch_name === activeSlot.groupBranch))
            : []
        }
        excludeIds={
          activeSlot
            ? (() => {
                const s = staffing[activeSlot.groupId];
                if (!s) return [];
                const all = [s.headCoachId, ...s.assistants.map((a) => a.id)].filter(Boolean) as string[];
                // Şu an düzenlenen slotun kendi sahibini listeden hariç tutma
                // ki "aynı kişiyi tekrar seç" mümkün olsun.
                return all.filter((id) => id !== activeSlot.currentCoachId);
              })()
            : []
        }
        onSelect={handlePick}
        onClose={() => setActiveSlot(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.sm },
  error: { color: colors.coral, marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  branchHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  branchHeaderBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  branchHeaderText: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  branchGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  groupCard: {
    width: "32%", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: 6,
  },
  groupName: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  groupBranch: { color: colors.muted, fontSize: 9, marginTop: 1, marginBottom: 2 },
  slotRow: {
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 3,
  },
  slotLabel: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  slotValue: { color: colors.teal, fontSize: 10, fontWeight: "700" },
  slotValueEmpty: { color: colors.yellow, fontSize: 10, fontWeight: "700" },
});
