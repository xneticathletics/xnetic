import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { getProgram, listProgramItems, deleteProgram, type FitnessProgram, type FitnessProgramItem } from "../lib/api/fitnessPrograms";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessProgramDetail">;

export default function FitnessProgramDetailScreen({ route, navigation }: Props) {
  const { programId } = route.params;
  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [items, setItems] = useState<FitnessProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProgram(programId), listProgramItems(programId)])
      .then(([p, i]) => {
        if (cancelled) return;
        setProgram(p);
        setItems(i);
        navigation.setOptions({ title: p.name });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [programId]);

  const handleDelete = () => {
    Alert.alert("Programı Sil", "Bu programı silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          await deleteProgram(programId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>{program?.name}</Text>
      {program?.groups && (
        <Text style={styles.groupText}>{program.groups.name} · {program.groups.branch}</Text>
      )}
      {program && (
        <Text style={styles.dateText}>{new Date(program.created_at).toLocaleDateString("tr-TR")}</Text>
      )}

      <Text style={styles.sectionTitle}>Hareketler</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemName}>{item.exercise_name}</Text>
          <Text style={styles.itemDetail}>{item.sets} set × {item.reps} tekrar</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Programı Sil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: 4 },
  groupText: { color: colors.violet, fontSize: 13, fontWeight: "600", marginBottom: 2 },
  dateText: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },
  itemRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  itemName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemDetail: { color: colors.muted, fontSize: 12 },
  deleteButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.xl,
  },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});
