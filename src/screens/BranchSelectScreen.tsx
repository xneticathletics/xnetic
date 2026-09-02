import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listBranches, type Branch } from "../lib/api/branches";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "BranchSelect">;

export default function BranchSelectScreen({ navigation }: Props) {
  const { setSelectedBranch } = useBranchSelect();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listBranches()
        .then(setBranches)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [])
  );

  const choose = (branch: Branch) => {
    setSelectedBranch(branch.name);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hangi Branşla Çalışıyorsun?</Text>
      <Text style={styles.subtitle}>
        Kulübünüz birden fazla branşla çalışıyor — devam etmeden önce birini seç.
        İstediğin zaman değiştirebilirsin.
      </Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingTop: spacing.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => choose(item)}>
            <Text style={styles.rowText}>{item.name}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: spacing.xl * 1.5 },
  title: { color: colors.ink, fontSize: 24, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  error: { color: colors.coral, marginTop: spacing.md },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  rowText: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  chevron: { color: colors.yellow, fontSize: 22, fontWeight: "700" },
});
