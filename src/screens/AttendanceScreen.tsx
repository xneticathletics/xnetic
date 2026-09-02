import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getSessionRoster, saveAttendance, type AttendanceStatus, type RosterEntry } from "../lib/api/attendance";
import { completeSession, getSession, isAttendanceWindowOpen, isCompletionWindowOpen, type TrainingSession } from "../lib/api/trainingSessions";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useClubSettings } from "../context/ClubSettingsContext";

type Props = NativeStackScreenProps<HomeStackParamList, "Attendance">;

export default function AttendanceScreen({ route, navigation }: Props) {
  const { sessionId, groupId, groupName } = route.params;
  const { settings } = useClubSettings();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışabiliyordu. handleSave
  // ve handleComplete aynı "saving" bayrağını paylaştığı için tek bir ref
  // ikisini de kilitliyor — biri sürerken diğerine dokunuş da engellenir.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getSession(sessionId), getSessionRoster(sessionId, groupId)])
        .then(([s, r]) => {
          setSession(s);
          setRoster(r);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [sessionId, groupId])
  );

  const setStatus = (athleteId: string, status: AttendanceStatus) => {
    setRoster((r) => r.map((entry) => (entry.athlete_id === athleteId ? { ...entry, status } : entry)));
  };

  // Kalabalık gruplarda tek tek işaretlemek yerine: önce herkesi "Geldi"
  // yap, sonra sadece istisnaları (gelmeyenleri) tek tek değiştir.
  const markAllPresent = () => {
    setRoster((r) => r.map((entry) => ({ ...entry, status: "geldi" as AttendanceStatus })));
  };

  const markedCount = roster.filter((r) => r.status !== null).length;

  const handleSave = async () => {
    if (savingRef.current) return;
    if (session && !isAttendanceWindowOpen(session, settings.attendance_window_before_minutes, settings.attendance_window_after_minutes)) {
      Alert.alert(
        "Henüz zamanı değil",
        `Yoklama Al, antrenman başlamadan ${settings.attendance_window_before_minutes} dakika önce açılır ve başladıktan ${settings.attendance_window_after_minutes} dakika sonra kapanır.`,
        [{ text: "Tamam" }]
      );
      return;
    }
    const entries = roster.filter((r) => r.status !== null) as { athlete_id: string; status: AttendanceStatus }[];
    if (entries.length === 0) {
      Alert.alert("Eksik yoklama", "En az bir sporcu için durum seçmelisiniz.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await saveAttendance(sessionId, entries);
      Alert.alert("Kaydedildi", "Yoklama kaydedildi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (savingRef.current) return;
    if (session && !isCompletionWindowOpen(session, settings.completion_window_before_minutes)) {
      Alert.alert(
        "Henüz zamanı değil",
        `Antrenmanı Tamamlandı olarak işaretleme, bitişine ${settings.completion_window_before_minutes} dakika kalana kadar pasif kalır.`,
        [{ text: "Tamam" }]
      );
      return;
    }
    savingRef.current = true;
    try {
      await completeSession(sessionId);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "İşaretlenemedi", [{ text: "Tamam" }]);
    } finally {
      savingRef.current = false;
    }
  };

  const attendanceOpen = session
    ? isAttendanceWindowOpen(session, settings.attendance_window_before_minutes, settings.attendance_window_after_minutes)
    : false;
  const completionOpen = session ? isCompletionWindowOpen(session, settings.completion_window_before_minutes) : false;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.groupName}>{groupName || "Grup"}</Text>
        <Text style={styles.markedCount}>{markedCount}/{roster.length} işaretlendi</Text>
      </View>

      {!attendanceOpen && (
        <View style={styles.windowNotice}>
          <Text style={styles.windowNoticeText}>
            ⏱ Yoklama, antrenman başlamadan {settings.attendance_window_before_minutes} dakika önce açılır, başladıktan {settings.attendance_window_after_minutes} dakika sonra kapanır.
          </Text>
        </View>
      )}

      {roster.length > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllPresent}>
          <Text style={styles.markAllButtonText}>✓ Hepsini Geldi İşaretle</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={roster}
        keyExtractor={(r) => r.athlete_id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        ListEmptyComponent={<Text style={styles.empty}>Bu grupta aktif sporcu bulunamadı.</Text>}
        renderItem={({ item }) => (
          <View style={styles.athleteRow}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}

            <View style={styles.athleteInfo}>
              <Text style={styles.athleteName}>{item.full_name}</Text>
              {!!item.birth_date && <Text style={styles.athleteBirth}>{item.birth_date}</Text>}
            </View>

            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusButton, { borderColor: colors.teal }, item.status === "geldi" && { backgroundColor: colors.teal }]}
                onPress={() => setStatus(item.athlete_id, "geldi")}
              >
                <Text style={[styles.statusButtonText, { color: item.status === "geldi" ? colors.bg : colors.teal }]}>Geldi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { borderColor: colors.coral }, item.status === "gelmedi" && { backgroundColor: colors.coral }]}
                onPress={() => setStatus(item.athlete_id, "gelmedi")}
              >
                <Text style={[styles.statusButtonText, { color: item.status === "gelmedi" ? colors.bg : colors.coral }]}>Gelmedi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !attendanceOpen && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Yoklamayı Kaydet</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, !completionOpen && styles.buttonDisabledOutline]}
          onPress={handleComplete}
        >
          <Text style={[styles.completeButtonText, !completionOpen && { color: colors.muted }]}>
            Antrenmanı Tamamlandı Olarak İşaretle
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  headerInfo: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: spacing.lg, paddingBottom: spacing.md,
  },
  groupName: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  markedCount: { color: colors.muted, fontSize: 12 },
  markAllButton: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.teal, borderRadius: radius.md,
    paddingVertical: 12, alignItems: "center",
  },
  markAllButtonText: { color: colors.teal, fontWeight: "700", fontSize: 13 },
  windowNotice: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.yellowSoft, borderRadius: radius.md, padding: spacing.md,
  },
  windowNoticeText: { color: colors.yellow, fontSize: 12, lineHeight: 17 },
  buttonDisabled: { opacity: 0.5 },
  buttonDisabledOutline: { borderColor: colors.line, opacity: 0.6 },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  athleteRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  athleteInfo: { flex: 1 },
  athleteName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  athleteBirth: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statusButtons: { flexDirection: "row", gap: 8 },
  statusButton: {
    borderWidth: 1.5, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12, minWidth: 78, alignItems: "center",
  },
  statusButtonText: { fontSize: 13, fontWeight: "700" },
  footer: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  completeButton: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center",
  },
  completeButtonText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
});
