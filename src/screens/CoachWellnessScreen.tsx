import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import { listAthletesInGroups, listAllAthletes } from "../lib/api/athletes";
import { listLatestCheckinsForAthletes, type AthleteLatestCheckin } from "../lib/api/wellnessCheckins";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachWellness">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = new Date(new Date().toISOString().slice(0, 10)).getTime();
  return Math.round((now - then) / (1000 * 60 * 60 * 24));
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CoachWellnessScreen({ navigation }: Props) {
  const { role } = useAuth();
  const [rows, setRows] = useState<AthleteLatestCheckin[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // club_admin'in kendi koçluk yaptığı grup yoktur — kulüpteki TÜM
      // sporcuları görür. Antrenör sadece kendi grubundakileri görür.
      // Wellness check-in sadece müsabık sporcular için bir uygulama.
      const athletes =
        role === "club_admin"
          ? await listAllAthletes()
          : await listAthletesInGroups(await getMyCoachedGroupIds());
      const musabikAthletes = athletes.filter((a) => a.athlete_type === "musabik");
      setRows(await listLatestCheckinsForAthletes(musabikAthletes.map((a) => a.id)));
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const searching = query.trim().length > 0;
  const displayRows = useMemo(() => {
    if (searching) {
      const q = query.trim().toLowerCase();
      return rows.filter((r) => r.full_name.toLowerCase().includes(q));
    }
    // Arama yokken sadece BUGÜN check-in yapmış sporcular gösterilir —
    // geçmişte kalan/eski kayıtlar aramadan bulunabilir.
    const today = todayKey();
    return rows.filter((r) => r.latest?.checkin_date === today);
  }, [rows, query, searching]);

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Sporcuların her sabah kendi doldurduğu, uyku/enerji/kas ağrısı/ruh
        hâlini içeren günlük bir takip anketi. Resmi bir test değil — erken
        uyarı sinyali almak için buradan kimlerin doldurduğunu görebilirsin.
      </Text>
      <Text style={styles.subtitle}>
        {searching ? "Sporcu ara — herhangi birine dokunup geçmişini gör." : "Bugün check-in yapan müsabık sporcular."}
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Sporcu ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={displayRows}
        keyExtractor={(r) => r.athlete_id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {searching
                ? "Eşleşen sporcu bulunamadı."
                : role === "club_admin"
                ? "Bugün henüz check-in yapan sporcu yok."
                : "Grubunda bugün check-in yapan sporcu yok."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const stale = item.latest ? daysSince(item.latest.checkin_date) >= 3 : false;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("AthleteWellnessDetail", { athleteId: item.athlete_id, athleteName: item.full_name })}
            >
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.full_name}</Text>
                {item.latest ? (
                  <Text style={[styles.rowSub, stale && styles.rowSubStale]}>
                    Son check-in: {formatDate(item.latest.checkin_date)}
                    {stale ? " · Uzun süredir kayıt yok" : ""}
                  </Text>
                ) : (
                  <Text style={styles.rowSubStale}>Hiç check-in yapmadı</Text>
                )}
              </View>
              {item.latest && (
                <View style={styles.metricsBox}>
                  {item.latest.energy != null && <Text style={styles.metric}>⚡ {item.latest.energy}</Text>}
                  {item.latest.soreness != null && <Text style={styles.metric}>💪 {item.latest.soreness}</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  description: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: spacing.md },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
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
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rowSubStale: { color: colors.coral, fontSize: 11, marginTop: 2, fontWeight: "600" },
  metricsBox: { flexDirection: "row", gap: 6 },
  metric: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
