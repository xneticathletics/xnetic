import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getSessionRoster, saveAttendance, type AttendanceStatus, type RosterEntry } from "../lib/api/attendance";
import { completeSession, getSession, isAttendanceWindowOpen, isCompletionWindowOpen, isSessionPast, type TrainingSession } from "../lib/api/trainingSessions";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useClubSettings } from "../context/ClubSettingsContext";
import { useResponsiveColumns, fillGridRow } from "../hooks/useResponsiveColumns";
import Avatar from "../components/Avatar";

type Props = NativeStackScreenProps<HomeStackParamList, "Attendance">;

export default function AttendanceScreen({ route, navigation }: Props) {
  const { sessionId, groupId, groupName } = route.params;
  const { settings } = useClubSettings();
  const columns = useResponsiveColumns(2);

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
    // Pencere dışında kimse (admin dahil) kaydedemez — geçmiş bir
    // antrenmanın yoklaması artık sadece önizleme (kullanıcı kararı,
    // 2026-09-26). Sunucu (can_write_attendance) zaten aynı kuralı
    // uyguluyor; bu, kullanıcıya erken ve anlaşılır bir uyarı vermek için.
    if (session && !isAttendanceWindowOpen(session, settings.attendance_window_before_minutes, settings.attendance_window_after_minutes)) {
      Alert.alert(
        isSessionPast(session) ? "Artık değiştirilemez" : "Henüz zamanı değil",
        isSessionPast(session)
          ? "Bu antrenmanın yoklama penceresi kapandı. Geçmiş yoklamalar sadece görüntülenebilir, değiştirilemez."
          : `Günün Programı, antrenman başlamadan ${settings.attendance_window_before_minutes} dakika önce açılır ve başladıktan ${settings.attendance_window_after_minutes} dakika sonra kapanır.`,
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

  // Admin istisnası kaldırıldı — geçmiş bir antrenmanın yoklaması artık
  // hiç kimse tarafından değiştirilemez, sadece önizlenir (kullanıcı
  // kararı, 2026-09-26; sunucu tarafında da can_write_attendance ile
  // zorunlu kılınıyor).
  const attendanceOpen = session
    ? isAttendanceWindowOpen(session, settings.attendance_window_before_minutes, settings.attendance_window_after_minutes)
    : false;
  const completionOpen = session ? isCompletionWindowOpen(session, settings.completion_window_before_minutes) : false;
  const sessionIsPast = session ? isSessionPast(session) : false;

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
            {sessionIsPast
              ? "🔒 Bu antrenmanın yoklama penceresi kapandı — sadece önizleme, değiştirilemez."
              : `⏱ Yoklama, antrenman başlamadan ${settings.attendance_window_before_minutes} dakika önce açılır, başladıktan ${settings.attendance_window_after_minutes} dakika sonra kapanır.`}
          </Text>
        </View>
      )}

      {roster.length > 0 && attendanceOpen && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllPresent}>
          <Text style={styles.markAllButtonText}>✓ Hepsini Geldi İşaretle</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        key={`cols-${columns}`}
        data={fillGridRow(roster, columns)}
        keyExtractor={(r, index) => r?.athlete_id ?? `filler-${index}`}
        numColumns={columns}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.empty}>Bu grupta aktif sporcu bulunamadı.</Text>}
        renderItem={({ item }) => {
          if (!item) return <View style={[styles.athleteRow, styles.athleteRowFiller]} />;
          return (
          <View style={styles.athleteRow}>
            <View style={styles.athleteHeaderRow}>
              <Avatar photoUrl={item.photo_url} name={item.full_name} gender={item.gender} kind="athlete" size={56} />

              <View style={styles.athleteInfo}>
                <Text style={styles.athleteName} numberOfLines={2}>{item.full_name}</Text>
                {!!item.birth_date && <Text style={styles.athleteBirth}>{item.birth_date}</Text>}
              </View>
            </View>

            <View style={[styles.statusButtons, !attendanceOpen && styles.statusButtonsDisabled]}>
              <TouchableOpacity
                style={[styles.statusButton, item.status === "geldi" && { backgroundColor: colors.teal, borderColor: colors.teal }]}
                onPress={() => setStatus(item.athlete_id, "geldi")}
                disabled={!attendanceOpen}
                accessibilityRole="radio"
                accessibilityState={{ selected: item.status === "geldi", disabled: !attendanceOpen }}
              >
                <Text style={[styles.statusButtonText, item.status === "geldi" && styles.statusButtonTextActive]}>Geldi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, item.status === "gelmedi" && { backgroundColor: colors.coral, borderColor: colors.coral }]}
                onPress={() => setStatus(item.athlete_id, "gelmedi")}
                disabled={!attendanceOpen}
                accessibilityRole="radio"
                accessibilityState={{ selected: item.status === "gelmedi", disabled: !attendanceOpen }}
              >
                <Text style={[styles.statusButtonText, item.status === "gelmedi" && styles.statusButtonTextActive]}>Gelmedi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, item.status === "izinli" && { backgroundColor: colors.muted, borderColor: colors.muted }]}
                onPress={() => setStatus(item.athlete_id, "izinli")}
                disabled={!attendanceOpen}
                accessibilityRole="radio"
                accessibilityState={{ selected: item.status === "izinli", disabled: !attendanceOpen }}
              >
                <Text style={[styles.statusButtonText, item.status === "izinli" && styles.statusButtonTextActive]}>İzinli</Text>
              </TouchableOpacity>
            </View>
          </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !attendanceOpen && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || sessionIsPast}
        >
          {saving ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.saveButtonText}>{sessionIsPast ? "Sadece Önizleme" : "Yoklamayı Kaydet"}</Text>
          )}
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
    flex: 1,
    gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm,
  },
  athleteRowFiller: { opacity: 0 },
  athleteHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  athleteInfo: { flex: 1, gap: 2 },
  athleteName: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  athleteBirth: { color: colors.muted, fontSize: 11 },
  statusButtons: { flexDirection: "row", gap: 6 },
  statusButtonsDisabled: { opacity: 0.5 },
  // Üçü de işaretlenmeden önce AYNI nötr görünümde — hangisinin seçili
  // olduğu sadece dokunulunca (kendi rengiyle) belli olsun diye, önceden
  // her biri kendi rengiyle (teal/coral/muted) duran çerçeveler kaldırıldı
  // (kullanıcı isteği: "hepsi tek renk olsun, işaretlenen renklensin").
  statusButton: {
    flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.sm,
    paddingVertical: 6, alignItems: "center",
  },
  statusButtonText: { fontSize: 10, fontWeight: "700", color: colors.muted },
  statusButtonTextActive: { color: colors.bg },
  footer: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  completeButton: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center",
  },
  completeButtonText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
});
