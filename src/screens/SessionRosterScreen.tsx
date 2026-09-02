import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getSessionRoster, type RosterEntry, type AttendanceStatus } from "../lib/api/attendance";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";

type Props = NativeStackScreenProps<HomeStackParamList, "SessionRoster">;

const STATUS_LABEL: Record<AttendanceStatus, { text: string; color: string }> = {
  geldi: { text: "Geldi", color: colors.teal },
  gelmedi: { text: "Gelmedi", color: colors.coral },
  gec_kaldi: { text: "Geç Kaldı", color: colors.yellow },
  raporlu: { text: "Raporlu", color: colors.muted },
  izinli: { text: "İzinli", color: colors.muted },
};

// "Yoklama Al" (yazma) zaman penceresiyle sınırlı olsa da, bu ekran her
// zaman açık — sadece görüntüleme. Antrenman öncesi kadroyu, antrenman
// sonrası kimin gelip gelmediğini istediğin an burada kontrol edebilirsin.
export default function SessionRosterScreen({ route, navigation }: Props) {
  useHomeButton(navigation);
  const { sessionId, groupId, groupName } = route.params;

  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getSessionRoster(sessionId, groupId)
        .then(setRoster)
        .catch((e) => setError(e.message ?? "Yüklenemedi"))
        .finally(() => setLoading(false));
    }, [sessionId, groupId])
  );

  const markedCount = roster.filter((r) => r.status !== null).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{groupName || "Grup"}</Text>
      <Text style={styles.subtitle}>
        {roster.length === 0 ? "Sporcu yok" : `${markedCount}/${roster.length} yoklaması girilmiş`}
      </Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={roster}
        keyExtractor={(r) => r.athlete_id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bu grupta aktif sporcu yok.</Text> : null}
        renderItem={({ item }) => {
          const statusInfo = item.status ? STATUS_LABEL[item.status] : null;
          return (
            <View style={styles.row}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
              <Text style={[styles.statusBadge, { color: statusInfo?.color ?? colors.muted }]}>
                {statusInfo?.text ?? "İşaretlenmedi"}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  avatar: {
    width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 40, height: 40, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  rowName: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "600" },
  statusBadge: { fontSize: 12, fontWeight: "700" },
});
