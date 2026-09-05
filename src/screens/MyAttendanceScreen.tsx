import React, { useCallback, useState, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyAthletes } from "../lib/api/myAthletes";
import { listAthleteAttendance, type AthleteAttendanceRecord } from "../lib/api/attendance";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<HomeStackParamList, "MyAttendance">;

const STATUS_LABEL: Record<string, string> = {
  geldi: "Geldi", gelmedi: "Gelmedi", gec_kaldi: "Geç Kaldı", raporlu: "Raporlu", izinli: "İzinli",
};
const STATUS_COLOR: Record<string, string> = {
  geldi: colors.teal, gelmedi: colors.coral, gec_kaldi: colors.yellow, raporlu: colors.muted, izinli: colors.muted,
};

export default function MyAttendanceScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();
  const [records, setRecords] = useState<AthleteAttendanceRecord[]>([]);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya/bu ekrana her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          const athletes = await getMyAthletes();
          if (athletes.length === 0) {
            if (!cancelled) setError("Bağlı bir sporcu bulunamadı.");
            return;
          }
          if (!cancelled) {
            setAthleteId(athletes[0].id);
            setAthleteName(athletes[0].full_name);
          }
          const data = await listAthleteAttendance(athletes[0].id);
          if (!cancelled) setRecords(data);
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Yoklama geçmişi yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const presentCount = records.filter((r) => r.status === "geldi").length;

  return (
    <View style={styles.container}>
      {!!athleteName && (
        <Text style={styles.subtitle}>
          {athleteName} · {presentCount}/{records.length} antrenmana katıldı
        </Text>
      )}

      {role === "parent" && (
        <TouchableOpacity
          style={styles.freezeButton}
          onPress={() => navigation.navigate("MembershipFreeze", { athleteId: athleteId ?? undefined, athleteName: athleteName ?? undefined })}
        >
          <Text style={styles.freezeButtonText}>🧊 Kayıt Dondurma</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>Henüz yoklama kaydı yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowDate}>{item.session_date}</Text>
              {!!item.topic && <Text style={styles.rowTopic}>{item.topic}</Text>}
            </View>
            <Text style={[styles.statusBadge, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  error: { color: colors.coral, marginTop: spacing.md },
  freezeButton: {
    alignSelf: "flex-start", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.md,
  },
  freezeButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  rowDate: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  rowTopic: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusBadge: { fontWeight: "700", fontSize: 13 },
});
