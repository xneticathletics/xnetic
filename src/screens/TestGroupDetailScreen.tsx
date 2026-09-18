import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Keyboard,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getTestGroup, addAthletesToGroup, removeAthleteFromGroup, type TestGroup } from "../lib/api/performanceTestGroups";
import { createMeasurements, listLatestMeasurements } from "../lib/api/performanceMeasurements";
import type { Athlete } from "../lib/api/athletes";
import type { CustomPerformanceTest } from "../lib/api/customPerformanceTests";
import AthleteMultiPickerModal from "../components/AthleteMultiPickerModal";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "TestGroupDetail">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const cellKey = (athleteId: string, testId: string) => `${athleteId}|${testId}`;

// Test grubunda ölçüm girişi: bir sporcunun testine dokununca altında
// (aşağı açılan) değer girişi açılır — tarih/not yok (tarih otomatik bugün).
// Başka bir teste geçilince açık olan kapanır ama girilen değer salt okunur
// olarak testin kendisinde görünür; en alttaki sarı Kaydet hepsini tek
// seferde kaydeder.
export default function TestGroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const headerHeight = useHeaderHeight();
  const listRef = useRef<FlatList<Athlete>>(null);
  const [group, setGroup] = useState<TestGroup | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athletePickerVisible, setAthletePickerVisible] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [latest, setLatest] = useState<Map<string, { value: number; measured_at: string }>>(new Map());
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const enteredCount = useMemo(
    () => Object.values(values).filter((v) => v.trim() !== "").length,
    [values]
  );
  useUnsavedChangesGuard(navigation, enteredCount > 0);

  const loadLatest = useCallback(async (a: Athlete[], t: CustomPerformanceTest[]) => {
    try {
      const map = await listLatestMeasurements(a.map((x) => x.id), t.map((x) => `custom:${x.id}`));
      setLatest(map);
    } catch {
      // ipucu kritik değil — sessizce yut
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getTestGroup(groupId);
      setGroup(data.group);
      setAthletes(data.athletes);
      setTests(data.tests);
      navigation.setOptions({ title: data.group.name });
      loadLatest(data.athletes, data.tests);
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [groupId, navigation, loadLatest]);

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

  const scrollToAthlete = (athleteId: string) => {
    const index = athletes.findIndex((a) => a.id === athleteId);
    if (index < 0) return;
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index, viewPosition: 0.1, animated: true });
    }, 120);
  };

  const activate = (athleteId: string, testId: string) => {
    const key = cellKey(athleteId, testId);
    setActiveKey((prev) => (prev === key ? null : key));
    scrollToAthlete(athleteId);
  };

  // Sıra: sporcu sporcu, her sporcunun testleri sırayla — "Sonraki" / klavyedeki
  // Bitti tuşu bir sonrakine geçirir, sonuncuda girişi kapatır.
  const goNext = () => {
    if (!activeKey) return;
    const order = athletes.flatMap((a) => tests.map((t) => ({ athleteId: a.id, testId: t.id })));
    const idx = order.findIndex((o) => cellKey(o.athleteId, o.testId) === activeKey);
    const next = order[idx + 1];
    if (!next) {
      setActiveKey(null);
      Keyboard.dismiss();
      return;
    }
    setActiveKey(cellKey(next.athleteId, next.testId));
    scrollToAthlete(next.athleteId);
  };

  const setValue = (key: string, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text.replace(/[^0-9.,]/g, "") }));
  };

  const handleSave = async () => {
    if (savingRef.current || enteredCount === 0) return;
    const rows: { athlete_id: string; test_key: string; value: number; measured_at: string; notes: null }[] = [];
    for (const athlete of athletes) {
      for (const test of tests) {
        const raw = (values[cellKey(athlete.id, test.id)] ?? "").trim();
        if (!raw) continue;
        const num = Number(raw.replace(",", "."));
        if (!Number.isFinite(num)) {
          Alert.alert("Geçersiz değer", `${athlete.full_name} — ${test.name} için geçerli bir sayı gir.`, [{ text: "Tamam" }]);
          return;
        }
        rows.push({ athlete_id: athlete.id, test_key: `custom:${test.id}`, value: num, measured_at: todayKey(), notes: null });
      }
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await createMeasurements(rows);
      setValues({});
      setActiveKey(null);
      Keyboard.dismiss();
      loadLatest(athletes, tests);
      Alert.alert("Kaydedildi", `${rows.length} ölçüm kaydedildi.`, [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
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

  const activeTest = activeKey ? tests.find((t) => activeKey.endsWith(`|${t.id}`)) : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={listRef}
        data={athletes}
        keyExtractor={(a) => a.id}
        keyboardShouldPersistTaps="handled"
        extraData={{ values, activeKey, latest }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
        }}
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
            <Text style={styles.hint}>
              Bir sporcunun testine dokun, altında açılan alana ölçümü yaz — sonra sarı Kaydet'e bas.
            </Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>Bu test grubunda henüz sporcu yok.</Text>}
        renderItem={({ item: athlete }) => {
          const isActiveAthlete = !!activeKey && activeKey.startsWith(`${athlete.id}|`);
          const last = activeTest && isActiveAthlete ? latest.get(`${athlete.id}|custom:${activeTest.id}`) : undefined;
          return (
            <View style={[styles.athleteCard, isActiveAthlete && styles.athleteCardActive]}>
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
                {tests.map((test) => {
                  const key = cellKey(athlete.id, test.id);
                  const entered = (values[key] ?? "").trim();
                  const isActive = activeKey === key;
                  return (
                    <TouchableOpacity
                      key={test.id}
                      style={[
                        styles.testChip,
                        !!entered && styles.testChipFilled,
                        isActive && styles.testChipActive,
                      ]}
                      onPress={() => activate(athlete.id, test.id)}
                    >
                      <Text style={[styles.testChipText, !!entered && styles.testChipTextFilled]}>
                        {test.name}{entered ? `: ${entered} ${test.unit}` : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isActiveAthlete && activeTest && activeKey && (
                <View style={styles.inputPanel}>
                  <Text style={styles.inputLabel}>{activeTest.name} ({activeTest.unit})</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.valueInput}
                      value={values[activeKey] ?? ""}
                      onChangeText={(t) => setValue(activeKey, t)}
                      keyboardType="decimal-pad"
                      placeholder={`Değer (${activeTest.unit})`}
                      placeholderTextColor={colors.muted}
                      autoFocus
                      returnKeyType="next"
                      onSubmitEditing={goNext}
                      blurOnSubmit={false}
                    />
                    <TouchableOpacity style={styles.nextButton} onPress={goNext}>
                      <Text style={styles.nextButtonText}>Sonraki ›</Text>
                    </TouchableOpacity>
                  </View>
                  {last && (
                    <Text style={styles.lastHint}>
                      Son ölçüm: {last.value} {activeTest.unit} ({formatDate(last.measured_at)})
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveButton, (enteredCount === 0 || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={enteredCount === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.saveButtonText}>Kaydet{enteredCount > 0 ? ` (${enteredCount})` : ""}</Text>
          )}
        </TouchableOpacity>
      </View>

      <AthleteMultiPickerModal
        visible={athletePickerVisible}
        onConfirm={handleAddAthletes}
        onClose={() => setAthletePickerVisible(false)}
      />
    </KeyboardAvoidingView>
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
  athleteCardActive: { borderColor: colors.yellow },
  athleteHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  athleteName: { color: colors.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  removeText: { color: colors.coral, fontSize: 11, fontWeight: "700" },
  testChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  testChip: {
    backgroundColor: colors.violet + "22", borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  testChipFilled: { backgroundColor: colors.teal + "22", borderColor: colors.teal },
  testChipActive: { borderColor: colors.yellow, borderWidth: 2 },
  testChipText: { color: colors.violet, fontSize: 12, fontWeight: "600" },
  testChipTextFilled: { color: colors.teal },
  inputPanel: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.sm, gap: spacing.xs,
  },
  inputLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  valueInput: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, fontSize: 18, fontWeight: "700", paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  nextButton: {
    borderWidth: 1, borderColor: colors.yellow, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  nextButtonText: { color: colors.yellow, fontWeight: "700", fontSize: 13 },
  lastHint: { color: colors.muted, fontSize: 11 },
  saveBar: {
    padding: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
});
