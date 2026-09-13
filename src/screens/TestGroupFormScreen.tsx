import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import GroupMultiPickerModal from "../components/GroupMultiPickerModal";
import AthleteMultiPickerModal from "../components/AthleteMultiPickerModal";
import TestMultiPickerModal from "../components/TestMultiPickerModal";
import { listAthletesInGroups, type Athlete } from "../lib/api/athletes";
import { createTestGroup } from "../lib/api/performanceTestGroups";
import type { CustomPerformanceTest } from "../lib/api/customPerformanceTests";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "TestGroupForm">;

export default function TestGroupFormScreen({ navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [name, setName] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [athletePickerVisible, setAthletePickerVisible] = useState(false);
  const [testPickerVisible, setTestPickerVisible] = useState(false);
  const [loadingGroupAthletes, setLoadingGroupAthletes] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const addAthletes = (newOnes: Athlete[]) => {
    setAthletes((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      return [...prev, ...newOnes.filter((a) => !existingIds.has(a.id))];
    });
  };

  const handlePickGroups = async (groups: { id: string }[]) => {
    if (groups.length === 0) return;
    setLoadingGroupAthletes(true);
    try {
      addAthletes(await listAthletesInGroups(groups.map((g) => g.id)));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Sporcular yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setLoadingGroupAthletes(false);
    }
  };

  const removeAthlete = (id: string) => {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Test grubuna bir isim vermelisin.", [{ text: "Tamam" }]);
    if (athletes.length === 0) return Alert.alert("Eksik bilgi", "En az bir sporcu seçmelisin.", [{ text: "Tamam" }]);
    if (tests.length === 0) return Alert.alert("Eksik bilgi", "En az bir test seçmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const group = await createTestGroup({
        name: name.trim(),
        athleteIds: athletes.map((a) => a.id),
        testIds: tests.map((t) => t.id),
      });
      navigation.replace("TestGroupDetail", { groupId: group.id });
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Grup Adı *</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Örn. 13 Eylül Sürat Testi"
          placeholderTextColor={colors.muted}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sporcular ({athletes.length})</Text>
        </View>
        <View style={styles.pickButtonRow}>
          <TouchableOpacity style={styles.pickButton} onPress={() => setGroupPickerVisible(true)} disabled={loadingGroupAthletes}>
            {loadingGroupAthletes ? <ActivityIndicator color={colors.ink} size="small" /> : <Text style={styles.pickButtonText}>👥 Gruptan Ekle</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickButton} onPress={() => setAthletePickerVisible(true)}>
            <Text style={styles.pickButtonText}>+ Sporcu Ekle</Text>
          </TouchableOpacity>
        </View>

        {athletes.length === 0 ? (
          <Text style={styles.emptyHint}>Henüz sporcu eklenmedi.</Text>
        ) : (
          <View style={styles.chipWrap}>
            {athletes.map((a) => (
              <View key={a.id} style={styles.athleteChip}>
                <Text style={styles.athleteChipText} numberOfLines={1}>{a.full_name}</Text>
                <TouchableOpacity onPress={() => removeAthlete(a.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.athleteChipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Testler ({tests.length})</Text>
        </View>
        <TouchableOpacity style={styles.pickButton} onPress={() => setTestPickerVisible(true)}>
          <Text style={styles.pickButtonText}>✓ Testleri Seç</Text>
        </TouchableOpacity>

        {tests.length === 0 ? (
          <Text style={styles.emptyHint}>Henüz test seçilmedi.</Text>
        ) : (
          <View style={styles.chipWrap}>
            {tests.map((t) => (
              <View key={t.id} style={styles.testChip}>
                <Text style={styles.testChipText} numberOfLines={1}>{t.name}</Text>
              </View>
            ))}
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Test Grubunu Oluştur</Text>}
        </TouchableOpacity>
      </ScrollView>

      <GroupMultiPickerModal
        visible={groupPickerVisible}
        selectedIds={[]}
        onConfirm={handlePickGroups}
        onClose={() => setGroupPickerVisible(false)}
      />
      <AthleteMultiPickerModal
        visible={athletePickerVisible}
        onConfirm={addAthletes}
        onClose={() => setAthletePickerVisible(false)}
      />
      <TestMultiPickerModal
        visible={testPickerVisible}
        selectedIds={tests.map((t) => t.id)}
        onConfirm={setTests}
        onClose={() => setTestPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  sectionHeaderRow: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  pickButtonRow: { flexDirection: "row", gap: spacing.sm },
  pickButton: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 12, alignItems: "center", backgroundColor: colors.surface,
  },
  pickButtonText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  emptyHint: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  athleteChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6, maxWidth: 180,
  },
  athleteChipText: { color: colors.ink, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  athleteChipRemove: { color: colors.coral, fontSize: 12, fontWeight: "800" },
  testChip: {
    backgroundColor: colors.violet + "22", borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6, maxWidth: 200,
  },
  testChipText: { color: colors.violet, fontSize: 12, fontWeight: "600" },
  errorText: { color: colors.coral, marginTop: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
