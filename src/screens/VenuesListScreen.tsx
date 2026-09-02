import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listVenues, type Venue } from "../lib/api/venues";
import { listBranches, type Branch } from "../lib/api/branches";

// Bu ekran hem ClubSettingsStack'ten hem de HomeStack'ten (Kulüp Yapısı)
// açılabiliyor — bkz. GroupsListScreen.tsx'teki aynı not.
type Props = { navigation: NativeStackNavigationProp<any> };

export default function VenuesListScreen({ navigation }: Props) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [v, b] = await Promise.all([listVenues(), listBranches()]);
      setVenues(v);
      setBranches(b);
    } catch (e: any) {
      setError(e.message ?? "Salonlar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, []);

  const branchNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    branches.forEach((b) => { map[b.id] = b.name; });
    return map;
  }, [branches]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("VenueForm", { venueId: undefined })}>
          <Text style={styles.addButtonText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={venues}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz salon eklenmemiş.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("VenueForm", { venueId: item.id })}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowSub}>
              {item.address ?? "Adres girilmemiş"}{item.capacity ? ` · ${item.capacity} kişilik` : ""}
            </Text>
            <Text style={styles.rowBranches}>
              {item.branch_ids.length > 0
                ? item.branch_ids.map((id) => branchNameById[id]).filter(Boolean).join(", ")
                : "Branş atanmadı"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowBranches: { color: colors.teal, fontSize: 12, fontWeight: "600", marginTop: 4 },
});
