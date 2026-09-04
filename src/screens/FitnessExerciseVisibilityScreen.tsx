import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Switch, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getFitnessCategory } from "../lib/fitnessExercises";
import { listCustomExercisesByCategory, type CustomFitnessExercise } from "../lib/api/customFitnessExercises";
import { listHiddenExerciseIds, hideExercise, showExercise } from "../lib/api/fitnessExerciseVisibility";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessExerciseVisibility">;

// Kulübün kendi görünümünden gizleyebileceği hareketler SADECE global
// (club_id null) olanlardır — kulübün kendi eklediği özel hareketleri zaten
// doğrudan silebiliyor, o yüzden burada listelenmiyor. Global harekete hiçbir
// şekilde dokunulmuyor, sadece bu kulüp için görünürlüğü kapatılıyor/açılıyor.
export default function FitnessExerciseVisibilityScreen({ route }: Props) {
  const { category } = route.params;
  const meta = getFitnessCategory(category);

  const [globalExercises, setGlobalExercises] = useState<CustomFitnessExercise[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [all, hidden] = await Promise.all([listCustomExercisesByCategory(category), listHiddenExerciseIds()]);
      setGlobalExercises(all.filter((e) => e.club_id === null));
      setHiddenIds(hidden);
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggle = async (exerciseId: string, nextVisible: boolean) => {
    setSavingId(exerciseId);
    const prev = new Set(hiddenIds);
    const next = new Set(hiddenIds);
    if (nextVisible) next.delete(exerciseId);
    else next.add(exerciseId);
    setHiddenIds(next);
    try {
      if (nextVisible) await showExercise(exerciseId);
      else await hideExercise(exerciseId);
    } catch (e: any) {
      setHiddenIds(prev);
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (!meta) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>Kategori bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoBox}>
        {meta.label} kategorisindeki genel hareketlerden kulübünle ilgisiz olanları
        kapatabilirsin — sadece senin kulübünde görünmez olur, global listeden
        ya da diğer kulüplerden hiçbir şey silinmez. İstediğin an tekrar açabilirsin.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={globalExercises}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Bu kategoride genel hareket yok.</Text> : null}
        renderItem={({ item }) => {
          const visible = !hiddenIds.has(item.id);
          return (
            <View style={styles.row}>
              <Text style={[styles.rowName, !visible && styles.rowNameHidden]}>{item.name}</Text>
              {savingId === item.id ? (
                <ActivityIndicator color={colors.yellow} />
              ) : (
                <Switch
                  value={visible}
                  onValueChange={(v) => handleToggle(item.id, v)}
                  trackColor={{ false: colors.line, true: colors.tealSoft }}
                  thumbColor={visible ? colors.teal : colors.muted}
                />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
  rowNameHidden: { color: colors.muted, textDecorationLine: "line-through" },
});
