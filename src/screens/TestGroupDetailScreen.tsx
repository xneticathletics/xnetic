import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getTestGroup, addAthletesToGroup, removeAthleteFromGroup, type TestGroup } from "../lib/api/performanceTestGroups";
import type { Athlete } from "../lib/api/athletes";
import type { CustomPerformanceTest } from "../lib/api/customPerformanceTests";
import AthleteMultiPickerModal from "../components/AthleteMultiPickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "TestGroupDetail">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function TestGroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<TestGroup | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athletePickerVisible, setAthletePickerVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getTestGroup(groupId);
      setGroup(data.group);
      setAthletes(data.athletes);
      setTests(data.tests);
      navigation.setOptions({ title: data.group.name });
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [groupId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAddAthletes = async (newOnes: Athlete[]) => {
    const toAdd = newOnes.filter((a) => !athletes.some((existing) => existing.id === a.id));
    if (toAdd.length === 0) return;
    try {
      await addAthletesToGroup(groupId, toAdd.map((a) => a.id));
      load();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Eklenemedi", [{ text: "Tamam" }]);
    }
  };

  const handleRemoveAthlete = (athlete: Athlete) => {
    Alert.alert("Sporcuyu çıkar", `"${athlete.full_name}" bu test grubundan çıkarılacak. Emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkar",
        style: "destructive",
        onPress: async () => {
          try {
            await removeAthleteFromGroup(groupId, athlete.id);
            load();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Çıkarılamadı", [{ text: "Tamam" }]);
          }
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

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error ?? "Test grubu bulunamadı."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={athletes}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>{group.name}</Text>
              <Text style={styles.heroSubtitle}>
                {athletes.length} sporcu · {tests.length} test · {formatDate(group.created_at)}
              </Text>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={styles.addButton} onPress={() => setAthletePickerVisible(true)}>
              <Text style={styles.addButtonText}>+ Sporcu Ekle</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Bir sporcunun bir testine dokunarak ölçüm gir.</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>Bu test grubunda henüz sporcu yok.</Text>}
        renderItem={({ item: athlete }) => (
          <View style={styles.athleteCard}>
            <View style={styles.athleteHeaderRow}>
              <Text style={styles.athleteName} numberOfLines={1}>{athlete.full_name}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveAthlete(athlete)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removeText}>Çıkar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.testChipRow}>
              {tests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.testChip}
                  onPress={() =>
                    navigation.navigate("PerformanceTestDetail", {
                      testKey: `custom:${test.id}`,
                      athleteId: athlete.id,
                      athleteName: athlete.full_name,
                    })
                  }
                >
                  <Text style={styles.testChipText}>{test.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      <AthleteMultiPickerModal
        visible={athletePickerVisible}
        onConfirm={handleAddAthletes}
        onClose={() => setAthletePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  heroCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  heroTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  heroSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  addButton: {
    borderWidth: 1, borderColor: colors.yellow, borderRadius: radius.md,
    paddingVertical: 12, alignItems: "center", marginBottom: spacing.sm,
  },
  addButtonText: { color: colors.yellow, fontWeight: "700", fontSize: 13 },
  hint: { color: colors.muted, fontSize: 11, marginBottom: spacing.md, textAlign: "center" },
  athleteCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.sm,
  },
  athleteHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  athleteName: { color: colors.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  removeText: { color: colors.coral, fontSize: 11, fontWeight: "700" },
  testChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  testChip: {
    backgroundColor: colors.violet + "22", borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  testChipText: { color: colors.violet, fontSize: 12, fontWeight: "600" },
});
