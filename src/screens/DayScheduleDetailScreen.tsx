import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { completeSession, deleteSession, type TrainingSession } from "../lib/api/trainingSessions";
import DayAgendaItem, { type DayItem } from "../components/DayAgendaItem";

type Props = NativeStackScreenProps<HomeStackParamList, "DayScheduleDetail">;

// Takvimde ZATEN seçili olan bir güne ikinci kez dokununca açılır — o günün
// tüm antrenman/müsabakalarını tam ekran gösterir. Veri, TrainingSessionsScreen
// tarafından o an zaten hesaplanmış olarak parametre ile geliyor (ayrıca bir
// sorgu YAPMIYOR) — geri dönüldüğünde takvim ekranı zaten her odaklanmada
// kendi load()'unu tekrar çalıştırdığı için (bkz. useFocusEffect orada),
// burada yapılan tamamlama/silme işlemleri geri dönüşte otomatik yansır.
export default function DayScheduleDetailScreen({ route, navigation }: Props) {
  const {
    date, staffing, isAdminOrCoordinator, authorizedVenueIds, individualBranchNames, branchByGroupId,
    attendanceWindowBeforeMinutes, attendanceWindowAfterMinutes, completionWindowBeforeMinutes,
  } = route.params;
  const [sessions, setSessions] = useState<TrainingSession[]>(route.params.sessions);
  const [matches] = useState(route.params.matches);
  const individualBranchSet = useState(() => new Set(individualBranchNames))[0];

  const dayItems: DayItem[] = [
    ...sessions.map((s) => ({ kind: "session" as const, data: s })),
    ...matches.map((m) => ({ kind: "match" as const, data: m })),
  ].sort((a, b) => a.data.start_time.localeCompare(b.data.start_time));

  const handleComplete = async (id: string) => {
    try {
      await completeSession(id);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "completed" } : s)));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "İşaretlenemedi", [{ text: "Tamam" }]);
    }
  };

  const handleDelete = (session: TrainingSession) => {
    Alert.alert(
      "Antrenmanı sil",
      "Bu geçmiş antrenman kaydını silmek istediğinden emin misin? Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSession(session.id);
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{date}</Text>
      <Text style={styles.countLabel}>
        {dayItems.length > 0 ? `${dayItems.length} etkinlik` : "Etkinlik yok"}
      </Text>

      <FlatList
        data={dayItems}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={styles.empty}>Bu gün için antrenman ya da müsabaka planlanmamış.</Text>}
        renderItem={({ item }) => (
          <DayAgendaItem
            item={item}
            navigation={navigation}
            staffing={staffing}
            isAdminOrCoordinator={isAdminOrCoordinator}
            authorizedVenueIds={authorizedVenueIds}
            individualBranchNames={individualBranchSet}
            branchByGroupId={branchByGroupId}
            attendanceWindowBeforeMinutes={attendanceWindowBeforeMinutes}
            attendanceWindowAfterMinutes={attendanceWindowAfterMinutes}
            completionWindowBeforeMinutes={completionWindowBeforeMinutes}
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  dateLabel: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  countLabel: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
});
