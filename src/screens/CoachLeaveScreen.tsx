import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getCoach, type Coach } from "../lib/api/coaches";
import { listCoachLeaves, createCoachLeave, deleteCoachLeave, type CoachLeave } from "../lib/api/coachLeaves";
import type { HomeStackParamList } from "../navigation/HomeStack";
import DatePickerModal from "../components/DatePickerModal";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachLeave">;

export default function CoachLeaveScreen({ route }: Props) {
  const { coachId, coachName } = route.params;

  const [coach, setCoach] = useState<Coach | null>(null);
  const [leaves, setLeaves] = useState<CoachLeave[]>([]);
  const [leaveStart, setLeaveStart] = useState<string | null>(null);
  const [leaveEnd, setLeaveEnd] = useState<string | null>(null);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [c, l] = await Promise.all([getCoach(coachId), listCoachLeaves(coachId)]);
      setCoach(c);
      setLeaves(l);
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

  const handleAddLeave = async () => {
    if (!leaveStart || !leaveEnd) {
      Alert.alert("Eksik bilgi", "Başlangıç ve bitiş tarihi seçmelisin.", [{ text: "Tamam" }]);
      return;
    }
    if (leaveEnd < leaveStart) {
      Alert.alert("Geçersiz tarih", "Bitiş tarihi başlangıçtan önce olamaz.", [{ text: "Tamam" }]);
      return;
    }
    setLeaveSaving(true);
    try {
      await createCoachLeave({ coach_id: coachId, start_date: leaveStart, end_date: leaveEnd, reason: leaveReason.trim() || null });
      setLeaves(await listCoachLeaves(coachId));
      setLeaveStart(null);
      setLeaveEnd(null);
      setLeaveReason("");
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleDeleteLeave = (leave: CoachLeave) => {
    Alert.alert("İzin kaydını sil", "Bu izin kaydını silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCoachLeave(leave.id);
            setLeaves(await listCoachLeaves(coachId));
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        style={{ flex: 1 }}
        data={leaves}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
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
              <Text style={styles.title}>{coachName}</Text>
            </View>

            <View style={styles.formBox}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Başlangıç</Text>
                <TouchableOpacity style={styles.fieldInput} onPress={() => setStartPickerVisible(true)}>
                  <Text style={{ color: leaveStart ? colors.ink : colors.muted }}>
                    {leaveStart ? new Date(leaveStart).toLocaleDateString("tr-TR") : "Tarih seç"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Bitiş</Text>
                <TouchableOpacity style={styles.fieldInput} onPress={() => setEndPickerVisible(true)}>
                  <Text style={{ color: leaveEnd ? colors.ink : colors.muted }}>
                    {leaveEnd ? new Date(leaveEnd).toLocaleDateString("tr-TR") : "Tarih seç"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Neden (isteğe bağlı)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={leaveReason}
                  onChangeText={setLeaveReason}
                  placeholder="Örn. Yıllık izin"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={handleAddLeave} disabled={leaveSaving}>
                {leaveSaving ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.addButtonText}>+ İzin Ekle</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Geçmiş İzinler</Text>
          </>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz izin kaydı yok.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.leaveRow} onLongPress={() => handleDeleteLeave(item)}>
            <Text style={styles.leaveDates}>
              {new Date(item.start_date).toLocaleDateString("tr-TR")} – {new Date(item.end_date).toLocaleDateString("tr-TR")}
            </Text>
            {!!item.reason && <Text style={styles.leaveReason}>{item.reason}</Text>}
          </TouchableOpacity>
        )}
      />

      <DatePickerModal
        visible={startPickerVisible}
        selectedDate={leaveStart}
        onSelect={(d) => { setLeaveStart(d); setStartPickerVisible(false); }}
        onClose={() => setStartPickerVisible(false)}
      />
      <DatePickerModal
        visible={endPickerVisible}
        selectedDate={leaveEnd}
        onSelect={(d) => { setLeaveEnd(d); setEndPickerVisible(false); }}
        onClose={() => setEndPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  error: { color: colors.coral, marginBottom: spacing.md },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.yellowSoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 16, fontWeight: "800" },
  title: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  formBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  fieldRow: { marginBottom: spacing.sm },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  fieldInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    color: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 13,
  },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.sm, paddingVertical: 12, alignItems: "center", marginTop: spacing.xs },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  leaveRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  leaveDates: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  leaveReason: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
