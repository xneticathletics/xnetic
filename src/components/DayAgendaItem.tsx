import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  isAttendanceWindowOpen, isCompletionWindowOpen, isSessionPast, type TrainingSession,
} from "../lib/api/trainingSessions";
import type { MatchRow } from "../lib/api/matches";
import type { GroupStaffing } from "../lib/api/coaches";
import type { HomeStackParamList } from "../navigation/HomeStack";

export type DayItem = { kind: "session"; data: TrainingSession } | { kind: "match"; data: MatchRow };

// TrainingSessionsScreen'in ana takvim listesi VE DayScheduleDetailScreen'in
// (bir güne ikinci kez dokununca açılan tam ekran) ortak satır render'ı —
// tek yerde bakım için ayrı bir bileşene çıkarıldı.
export default function DayAgendaItem({
  item,
  navigation,
  staffing,
  canManageSchedule,
  individualBranchNames,
  branchByGroupId,
  attendanceWindowBeforeMinutes,
  attendanceWindowAfterMinutes,
  completionWindowBeforeMinutes,
  onComplete,
  onDelete,
}: {
  item: DayItem;
  navigation: NativeStackNavigationProp<HomeStackParamList, any>;
  staffing: Record<string, GroupStaffing>;
  // Antrenmanı silme yetkisi: admin, branş koordinatörü ya da salon
  // yetkilisi — sıradan (etiketsiz) antrenör artık silemez.
  canManageSchedule: boolean;
  individualBranchNames: Set<string>;
  branchByGroupId: Record<string, string>;
  attendanceWindowBeforeMinutes: number;
  attendanceWindowAfterMinutes: number;
  completionWindowBeforeMinutes: number;
  onComplete: (id: string) => void;
  onDelete: (session: TrainingSession) => void;
}) {
  if (item.kind === "match") {
    const m = item.data;
    const isIndividual = m.group_id ? individualBranchNames.has(branchByGroupId[m.group_id]) : false;
    const hasResult = isIndividual ? !!m.result_note?.trim() : m.our_score !== null && m.opponent_score !== null;
    return (
      <View style={styles.matchRow}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate("MatchForm", { matchId: m.id })}>
          <View style={styles.rowTop}>
            <Text style={styles.matchGroup} numberOfLines={1}>🏆 {m.groups?.name ?? "Grup atanmadı"}</Text>
            <Text style={styles.matchTime}>{m.start_time.slice(0, 5)}</Text>
          </View>
          {!isIndividual && <Text style={styles.rowMeta} numberOfLines={1}>vs. {m.opponent_name}</Text>}
          {!!m.location && <Text style={styles.rowMeta} numberOfLines={1}>📍 {m.location}</Text>}
          {hasResult && (
            isIndividual ? (
              <Text style={styles.rowMeta} numberOfLines={2}>📋 {m.result_note}</Text>
            ) : (
              <Text style={styles.matchScore}>{m.our_score} - {m.opponent_score}</Text>
            )
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resultEntryButton}
          onPress={() => navigation.navigate("MatchResult", { matchId: m.id })}
        >
          <Text style={styles.resultEntryButtonText}>{hasResult ? "Sonucu Düzenle" : "Sonuç Gir"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const session = item.data;
  const s = session.group_id ? staffing[session.group_id] : undefined;
  const coachNames = s ? ([s.headName, ...s.assistantNames].filter(Boolean) as string[]) : [];
  const isCompleted = session.status === "completed";
  const attendanceOpen = isAttendanceWindowOpen(session, attendanceWindowBeforeMinutes, attendanceWindowAfterMinutes);
  const completionOpen = isCompletionWindowOpen(session, completionWindowBeforeMinutes);
  const isPast = isSessionPast(session);

  const handleYoklamaPress = () => {
    if (!attendanceOpen) {
      Alert.alert(
        "Henüz zamanı değil",
        `Yoklama Al, antrenman başlamadan ${attendanceWindowBeforeMinutes} dakika önce açılır ve başladıktan ${attendanceWindowAfterMinutes} dakika sonra kapanır.`,
        [{ text: "Tamam" }]
      );
      return;
    }
    navigation.navigate("Attendance", { sessionId: session.id, groupId: session.group_id, groupName: session.groups?.name ?? "" });
  };

  const handleCompletePress = () => {
    if (!completionOpen) {
      Alert.alert(
        "Henüz zamanı değil",
        `Antrenmanı Tamamlandı olarak işaretleme, bitişine ${completionWindowBeforeMinutes} dakika kalana kadar pasif kalır.`,
        [{ text: "Tamam" }]
      );
      return;
    }
    onComplete(session.id);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate("TrainingSessionForm", { sessionId: session.id })}
      >
        <View style={styles.rowTop}>
          <Text style={styles.rowGroup} numberOfLines={1}>{session.groups?.name ?? "Grup atanmadı"}</Text>
          <Text style={styles.rowTime}>{session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}</Text>
        </View>

        {coachNames.length > 0 && (
          <Text style={styles.rowMeta} numberOfLines={1}>🧑‍🏫 {coachNames.join(", ")}</Text>
        )}

        <Text style={styles.rowMeta} numberOfLines={1}>
          🏟 {session.venues?.name ?? "Salon atanmadı"}
        </Text>

        {!!session.topic && <Text style={styles.rowMeta} numberOfLines={1}>📝 {session.topic}</Text>}

        <View style={[styles.statusBadge, isCompleted ? styles.statusBadgeDone : styles.statusBadgePending]}>
          <Text style={[styles.statusBadgeText, isCompleted ? styles.statusBadgeTextDone : styles.statusBadgeTextPending]}>
            {isCompleted ? "✓ Tamamlandı" : "Planlandı"}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("SessionRoster", { sessionId: session.id, groupId: session.group_id, groupName: session.groups?.name ?? "" })}
        >
          <Text style={styles.actionButtonText}>👥 Sporcular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !attendanceOpen && styles.actionButtonDisabled]}
          onPress={handleYoklamaPress}
        >
          <Text style={[styles.actionButtonText, !attendanceOpen && styles.actionButtonTextDisabled]}>
            Yoklama Al
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("SessionMedia", { sessionId: session.id, label: `${session.groups?.name ?? ""} · ${session.session_date}` })}
        >
          <Text style={styles.actionButtonText}>📷 Fotoğraflar</Text>
        </TouchableOpacity>
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.completeButton, !completionOpen && styles.actionButtonDisabled]}
            onPress={handleCompletePress}
          >
            <Text style={[styles.completeButtonText, !completionOpen && styles.actionButtonTextDisabled]}>
              ✓ Tamamlandı
            </Text>
          </TouchableOpacity>
        )}
        {isPast && canManageSchedule && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(session)}>
            <Text style={styles.deleteButtonText}>🗑 Sil</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowTime: { color: colors.teal, fontWeight: "700", fontSize: 15, marginLeft: spacing.sm },
  rowGroup: { color: colors.ink, fontSize: 17, fontWeight: "700", flexShrink: 1 },
  rowMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, marginTop: spacing.xs },
  statusBadgeDone: { backgroundColor: colors.tealSoft },
  statusBadgePending: { backgroundColor: colors.yellowSoft },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  statusBadgeTextDone: { color: colors.teal },
  statusBadgeTextPending: { color: colors.yellow },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionButton: {
    borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
  },
  actionButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  actionButtonDisabled: { borderColor: colors.line, opacity: 0.5 },
  actionButtonTextDisabled: { color: colors.muted },
  completeButton: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
  },
  completeButtonText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  deleteButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
  },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 12 },
  matchRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.coral,
    borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  matchGroup: { color: colors.ink, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  matchTime: { color: colors.coral, fontWeight: "700", fontSize: 15, marginLeft: spacing.sm },
  matchScore: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 4 },
  resultEntryButton: {
    borderWidth: 1, borderColor: colors.violet, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
  },
  resultEntryButtonText: { color: colors.violet, fontWeight: "700", fontSize: 11, textAlign: "center" },
});
