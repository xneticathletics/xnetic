import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listGroups, type Group } from "../lib/api/groups";
import { getMyCoachedGroupIds, getMyBranchGroupIds } from "../lib/api/myGroups";
import { getMyAuthorizedVenueIds } from "../lib/api/venueCoaches";
import {
  listTemplatesForGroups, createTemplate, deleteTemplate, setTemplateActive,
  generateSessionsFromTemplates, type ScheduleTemplate,
} from "../lib/api/trainingSchedule";
import type { Venue } from "../lib/api/venues";
import VenuePickerModal from "../components/VenuePickerModal";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";

type Props = NativeStackScreenProps<HomeStackParamList, "WeeklySchedule">;

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}
function formatTimeInput(text: string): string {
  const digits = text.replace(/[^0-9]/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

type NewRowState = { dayOfWeek: number; startTime: string; endTime: string; venueId: string | null; venueName: string | null };
const emptyNewRow: NewRowState = { dayOfWeek: 0, startTime: "", endTime: "", venueId: null, venueName: null };

export default function WeeklyScheduleScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const { isLocked } = useBranchSelect();
  const isCoordinator = role === "coach" && isLocked;

  const [groups, setGroups] = useState<Group[]>([]);
  const [myCoachedGroupIds, setMyCoachedGroupIds] = useState<string[]>([]);
  const [myBranchGroupIds, setMyBranchGroupIds] = useState<string[]>([]);
  const [authorizedVenueIds, setAuthorizedVenueIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [addFormGroupId, setAddFormGroupId] = useState<string | null>(null);
  // Çok grup olunca liste karmaşıklaşmasın diye her grup başta kapalı —
  // sadece isim+branş görünür, dokununca gün/saat detayları açılır.
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<NewRowState>(emptyNewRow);
  const [savingRow, setSavingRow] = useState(false);
  const [venuePickerVisible, setVenuePickerVisible] = useState(false);

  const hasLoadedOnceRef = useRef(false);

  // Salon yetkilisi (koordinatör değilse) sadece kendi yetkili olduğu
  // salon(lar)ı seçebilir — admin/koordinatör için serbest.
  const venueAllowedIds = !isCoordinator && role === "coach" ? authorizedVenueIds : undefined;

  const load = useCallback(async () => {
    try {
      setError(null);
      const [allGroups, coachedIds, branchIds, venueIds] = await Promise.all([
        listGroups(), getMyCoachedGroupIds(), getMyBranchGroupIds(), getMyAuthorizedVenueIds(),
      ]);
      setGroups(allGroups);
      setMyCoachedGroupIds(coachedIds);
      setMyBranchGroupIds(branchIds);
      setAuthorizedVenueIds(venueIds);
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

  // Admin: kulüpteki TÜM sabit-programlı gruplar. Koordinatör: sadece
  // kendi branşındaki (getMyCoachedGroupIds zaten koordinatörün tüm
  // branşını kapsıyor). Salon yetkilisi: kendi branşındaki tüm gruplar
  // (coach_branches üzerinden), koçluğunu yapmadığı gruplar dahil.
  const manageableGroups = useMemo(() => {
    if (role === "club_admin") return groups.filter((g) => g.fixed_schedule);
    if (isCoordinator) return groups.filter((g) => g.fixed_schedule && myCoachedGroupIds.includes(g.id));
    return groups.filter((g) => g.fixed_schedule && myBranchGroupIds.includes(g.id));
  }, [role, isCoordinator, groups, myCoachedGroupIds, myBranchGroupIds]);

  const manageableGroupIds = useMemo(() => manageableGroups.map((g) => g.id), [manageableGroups]);

  useFocusEffect(
    useCallback(() => {
      if (manageableGroupIds.length === 0) { setTemplates([]); return; }
      listTemplatesForGroups(manageableGroupIds).then(setTemplates).catch(() => {});
    }, [manageableGroupIds.join(",")])
  );

  const templatesByGroup = useMemo(() => {
    const map: Record<string, ScheduleTemplate[]> = {};
    templates.forEach((t) => { (map[t.group_id] ??= []).push(t); });
    Object.values(map).forEach((list) => list.sort((a, b) => a.day_of_week - b.day_of_week));
    return map;
  }, [templates]);

  const openAddForm = (groupId: string, group: Group) => {
    setAddFormGroupId(groupId);
    setNewRow({
      ...emptyNewRow,
      venueId: group.venue_id,
      venueName: group.venues?.name ?? null,
    });
  };

  const handleAddRow = async (groupId: string) => {
    if (savingRow) return;
    if (!isValidTime(newRow.startTime) || !isValidTime(newRow.endTime)) {
      Alert.alert("Geçersiz saat", "Başlangıç ve bitiş saatini SS:DD biçiminde gir (ör. 18:00).", [{ text: "Tamam" }]);
      return;
    }
    setSavingRow(true);
    try {
      await createTemplate({
        group_id: groupId, day_of_week: newRow.dayOfWeek,
        start_time: newRow.startTime, end_time: newRow.endTime, venue_id: newRow.venueId,
      });
      const fresh = await listTemplatesForGroups(manageableGroupIds);
      setTemplates(fresh);
      setAddFormGroupId(null);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Eklenemedi", [{ text: "Tamam" }]);
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeleteRow = (id: string) => {
    Alert.alert("Satırı sil", "Bu program satırını silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          try {
            await deleteTemplate(id);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
  };

  const handleToggleActive = async (t: ScheduleTemplate) => {
    try {
      await setTemplateActive(t.id, !t.active);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Güncellenemedi", [{ text: "Tamam" }]);
    }
  };

  const handleSendPlan = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateSessionsFromTemplates(manageableGroupIds);
      const lines = [`${result.created} antrenman oluşturuldu.`];
      if (result.skippedConflict.length > 0) {
        lines.push(
          `${result.skippedConflict.length} kayıt salon çakışması nedeniyle atlandı:`,
          ...result.skippedConflict
            .slice(0, 8)
            .map((c) => `• ${c.groupName} — ${c.date} ${c.time} (${c.venueName} dolu)`)
        );
      }
      Alert.alert("Plan Gönderildi", lines.join("\n"), [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Plan gönderilemedi", [{ text: "Tamam" }]);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Sadece "Sabit Haftalık Program" açık gruplar burada listelenir (Grup Ayarları'ndan admin tarafından açılır).
        Gün/saat/salon ekleyip "Planı Gönder"e bastığında, önümüzdeki 4 haftanın antrenman kayıtları otomatik oluşturulur.
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={manageableGroups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={styles.empty}>Sabit haftalık programı açık bir grup yok.</Text>}
        renderItem={({ item: group }) => {
          const rows = templatesByGroup[group.id] ?? [];
          const isAdding = addFormGroupId === group.id;
          const isExpanded = expandedGroupId === group.id;
          const activeCount = rows.filter((t) => t.active).length;
          return (
            <View style={styles.groupCard}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => {
                  setExpandedGroupId((prev) => (prev === group.id ? null : group.id));
                  setAddFormGroupId(null);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupBranch}>
                    {group.branch}{rows.length > 0 ? ` · ${activeCount} gün` : ""}
                  </Text>
                </View>
                <Text style={styles.groupChevron}>{isExpanded ? "▾" : "▸"}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={{ marginTop: spacing.sm }}>
              {rows.map((t) => (
                <View key={t.id} style={styles.templateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.templateDay, !t.active && styles.templateInactive]}>
                      {WEEKDAY_LABELS[t.day_of_week]} · {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
                    </Text>
                    <Text style={styles.templateVenue}>{t.venues?.name ?? "Salon atanmadı"}</Text>
                  </View>
                  <TouchableOpacity style={styles.smallButton} onPress={() => handleToggleActive(t)}>
                    <Text style={styles.smallButtonText}>{t.active ? "Pasifleştir" : "Aktifleştir"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteIconButton} onPress={() => handleDeleteRow(t.id)}>
                    <Text style={styles.deleteIconText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {isAdding ? (
                <View style={styles.addForm}>
                  <View style={styles.dayChipRow}>
                    {WEEKDAY_LABELS.map((label, idx) => (
                      <TouchableOpacity
                        key={label}
                        style={[styles.dayChip, newRow.dayOfWeek === idx && styles.dayChipActive]}
                        onPress={() => setNewRow((r) => ({ ...r, dayOfWeek: idx }))}
                      >
                        <Text style={[styles.dayChipText, newRow.dayOfWeek === idx && styles.dayChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.timeRow}>
                    <TextInput
                      style={[styles.timeInput, { flex: 1, marginRight: spacing.sm }]}
                      value={newRow.startTime}
                      onChangeText={(v) => setNewRow((r) => ({ ...r, startTime: formatTimeInput(v) }))}
                      placeholder="18:00"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    <TextInput
                      style={[styles.timeInput, { flex: 1 }]}
                      value={newRow.endTime}
                      onChangeText={(v) => setNewRow((r) => ({ ...r, endTime: formatTimeInput(v) }))}
                      placeholder="19:30"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <TouchableOpacity style={styles.venueButton} onPress={() => setVenuePickerVisible(true)}>
                    <Text style={{ color: newRow.venueName ? colors.ink : colors.muted }}>
                      {newRow.venueName ?? "Salon seç"}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.addFormActions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setAddFormGroupId(null)}>
                      <Text style={styles.cancelButtonText}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveRowButton}
                      onPress={() => handleAddRow(group.id)}
                      disabled={savingRow}
                    >
                      {savingRow ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.saveRowButtonText}>Ekle</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.addRowButton} onPress={() => openAddForm(group.id, group)}>
                  <Text style={styles.addRowButtonText}>+ Gün Ekle</Text>
                </TouchableOpacity>
              )}
                </View>
              )}
            </View>
          );
        }}
      />

      {manageableGroups.length > 0 && (
        <TouchableOpacity style={styles.sendButton} onPress={handleSendPlan} disabled={generating}>
          {generating ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.sendButtonText}>📤 Planı Gönder</Text>}
        </TouchableOpacity>
      )}

      <VenuePickerModal
        visible={venuePickerVisible}
        selectedId={newRow.venueId}
        allowedIds={venueAllowedIds}
        onSelect={(v: Venue) => setNewRow((r) => ({ ...r, venueId: v.id, venueName: v.name }))}
        onClose={() => setVenuePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  groupCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  groupHeader: { flexDirection: "row", alignItems: "center" },
  groupName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  groupBranch: { color: colors.muted, fontSize: 12, marginTop: 2 },
  groupChevron: { color: colors.muted, fontSize: 16, fontWeight: "700", marginLeft: spacing.sm },
  templateRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: spacing.sm,
  },
  templateDay: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  templateInactive: { color: colors.muted, textDecorationLine: "line-through" },
  templateVenue: { color: colors.muted, fontSize: 12, marginTop: 2 },
  smallButton: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  smallButtonText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  deleteIconButton: { padding: 6 },
  deleteIconText: { fontSize: 16 },
  addRowButton: {
    alignSelf: "flex-start", borderWidth: 1, borderColor: colors.yellow, borderStyle: "dashed",
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, marginTop: spacing.sm,
  },
  addRowButtonText: { color: colors.yellow, fontWeight: "700", fontSize: 12 },
  addForm: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm },
  dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm },
  dayChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  dayChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  dayChipText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  dayChipTextActive: { color: colors.bg },
  timeRow: { flexDirection: "row", marginBottom: spacing.sm },
  timeInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    color: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 8, textAlign: "center",
  },
  venueButton: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10, marginBottom: spacing.sm,
  },
  addFormActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  cancelButton: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  cancelButtonText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  saveRowButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, minWidth: 60, alignItems: "center" },
  saveRowButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  sendButton: {
    backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginBottom: spacing.lg,
  },
  sendButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
