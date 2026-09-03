import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getPerformanceCategory, type PerformanceCategory } from "../lib/performanceTests";
import { getCustomTest, type CustomPerformanceTest } from "../lib/api/customPerformanceTests";
import {
  listMeasurementsForAthleteTest, createMeasurement, deleteMeasurement, type PerformanceMeasurement,
} from "../lib/api/performanceMeasurements";
import type { Athlete } from "../lib/api/athletes";
import AthletePickerModal from "../components/AthletePickerModal";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "PerformanceTestDetail">;

const CUSTOM_PREFIX = "custom:";

type Resolved = { test: CustomPerformanceTest; category: PerformanceCategory };

async function resolveTest(testKey: string): Promise<Resolved | null> {
  if (!testKey.startsWith(CUSTOM_PREFIX)) return null;
  const id = testKey.slice(CUSTOM_PREFIX.length);
  const test = await getCustomTest(id);
  if (!test) return null;
  const category = getPerformanceCategory(test.category);
  if (!category) return null;
  return { test, category };
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function PerformanceTestDetailScreen({ route, navigation }: Props) {
  const { testKey } = route.params;
  const { handleFocus } = useKeyboardScroll();

  const [resolved, setResolved] = useState<Resolved | null | undefined>(undefined);

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [value, setValue] = useState("");
  const [measuredAt, setMeasuredAt] = useState(todayKey());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı ölçümü iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<PerformanceMeasurement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveTest(testKey).then((r) => {
      if (cancelled) return;
      setResolved(r);
      navigation.setOptions({ title: r?.test.name ?? "Test" });
    });
    return () => { cancelled = true; };
  }, [testKey, navigation]);

  const loadHistory = useCallback(async (athleteId: string) => {
    setLoadingHistory(true);
    try {
      setHistory(await listMeasurementsForAthleteTest(athleteId, testKey));
    } catch (e: any) {
      setError(e.message ?? "Geçmiş yüklenemedi");
    } finally {
      setLoadingHistory(false);
    }
  }, [testKey]);

  useFocusEffect(
    useCallback(() => {
      if (athlete) loadHistory(athlete.id);
    }, [athlete, loadHistory])
  );

  const handleSelectAthlete = (a: Athlete) => {
    setAthlete(a);
    setValue("");
    setNotes("");
    setMeasuredAt(todayKey());
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!athlete) return;
    const num = Number(value.trim().replace(",", "."));
    if (!value.trim() || !Number.isFinite(num)) {
      return Alert.alert("Eksik bilgi", "Geçerli bir ölçüm değeri girmelisin.", [{ text: "Tamam" }]);
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createMeasurement({
        athlete_id: athlete.id,
        test_key: testKey,
        value: num,
        measured_at: measuredAt,
        notes: notes.trim() || null,
      });
      setValue("");
      setNotes("");
      await loadHistory(athlete.id);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = (m: PerformanceMeasurement) => {
    Alert.alert(
      "Ölçümü sil",
      `${formatDate(m.measured_at)} tarihli ${m.value} ${resolved?.test.unit ?? ""} kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMeasurement(m.id);
              if (athlete) await loadHistory(athlete.id);
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (resolved === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  if (resolved === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Test bulunamadı.</Text>
      </View>
    );
  }

  const { test, category } = resolved;

  const handleVideoPress = () => {
    if (test.video_url) {
      Linking.openURL(test.video_url).catch(() => {
        Alert.alert("Açılamadı", "Video linki açılamadı.", [{ text: "Tamam" }]);
      });
    } else {
      setVideoModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
      data={athlete ? history : []}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={
        <>
          <View style={[styles.headerCard, { backgroundColor: category.soft, borderColor: category.color }]}>
            <Text style={styles.headerIcon}>{category.icon}</Text>
            <Text style={[styles.headerTitle, { color: category.color }]}>{test.name}</Text>
            <Text style={styles.headerUnit}>Birim: {test.unit}</Text>
            {!!test.equipment && <Text style={styles.headerEquipment}>🔧 {test.equipment}</Text>}
          </View>

          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>Nasıl Yapılır?</Text>
              <TouchableOpacity style={styles.videoButton} onPress={handleVideoPress}>
                <Text style={styles.videoButtonIcon}>🎥</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.instructionsText}>{test.instructions}</Text>
          </View>

          <TouchableOpacity style={styles.athleteButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.athleteButtonLabel}>{athlete ? "Sporcu" : "Sporcu Ara"}</Text>
            <Text style={styles.athleteButtonValue}>{athlete ? athlete.full_name : "Seçmek için dokun"}</Text>
          </TouchableOpacity>

          {athlete && (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>{`Değer (${test.unit}) *`}</Text>
              <TextInput
                onFocus={handleFocus}
                style={styles.input}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholder={`Örn. 4.5`}
                placeholderTextColor={colors.muted}
              />

              <Text style={styles.formLabel}>Tarih *</Text>
              <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
                <Text style={{ color: colors.ink }}>{formatDate(measuredAt)}</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>Not</Text>
              <TextInput
                onFocus={handleFocus}
                style={[styles.input, styles.inputMultiline]}
                value={notes}
                onChangeText={setNotes}
                placeholder="İsteğe bağlı not"
                placeholderTextColor={colors.muted}
                multiline
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: category.color }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>

              <Text style={styles.historyLabel}>
                {athlete.full_name} — Geçmiş Ölçümler{loadingHistory ? "…" : ""}
              </Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        athlete && !loadingHistory ? <Text style={styles.empty}>Bu sporcu için henüz kayıt yok.</Text> : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.historyRow} onLongPress={() => handleDelete(item)}>
          <View>
            <Text style={styles.historyValue}>{item.value} {test.unit}</Text>
            {!!item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
          </View>
          <Text style={styles.historyDate}>{formatDate(item.measured_at)}</Text>
        </TouchableOpacity>
      )}
    />

      <AthletePickerModal
        visible={pickerVisible}
        selectedId={athlete?.id ?? null}
        onSelect={handleSelectAthlete}
        onClose={() => setPickerVisible(false)}
      />

      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={measuredAt}
        onSelect={setMeasuredAt}
        onClose={() => setDatePickerVisible(false)}
      />

      <Modal visible={videoModalVisible} animationType="fade" transparent onRequestClose={() => setVideoModalVisible(false)}>
        <TouchableOpacity style={styles.videoOverlay} activeOpacity={1} onPress={() => setVideoModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.videoSheet} onPress={() => {}}>
            <Text style={styles.videoSheetIcon}>🎬</Text>
            <Text style={styles.videoSheetTitle}>Video Yakında</Text>
            <Text style={styles.videoSheetText}>
              "{test.name}" testinin nasıl yapıldığını gösteren video bu ekrana yakında eklenecek.
            </Text>
            <TouchableOpacity style={styles.videoSheetClose} onPress={() => setVideoModalVisible(false)}>
              <Text style={styles.videoSheetCloseText}>Kapat</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, textAlign: "center", marginTop: spacing.xl },
  headerCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  headerIcon: { fontSize: 36, marginBottom: spacing.xs },
  headerTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  headerUnit: { color: colors.muted, fontSize: 12, marginTop: 4 },
  headerEquipment: { color: colors.muted, fontSize: 11, marginTop: 4, fontStyle: "italic" },
  instructionsCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  instructionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  instructionsTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  videoButton: {
    width: 32, height: 32, borderRadius: radius.full, backgroundColor: `${colors.violet}22`,
    alignItems: "center", justifyContent: "center",
  },
  videoButtonIcon: { fontSize: 16 },
  instructionsText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  videoOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  videoSheet: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: "center", width: "100%", maxWidth: 340,
  },
  videoSheetIcon: { fontSize: 36, marginBottom: spacing.sm },
  videoSheetTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  videoSheetText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: spacing.lg },
  videoSheetClose: { backgroundColor: colors.violet, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 10 },
  videoSheetCloseText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  athleteButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  athleteButtonLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  athleteButtonValue: { color: colors.ink, fontSize: 15, fontWeight: "700", marginTop: 2 },
  formCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  formLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 56, textAlignVertical: "top" },
  errorText: { color: colors.coral, marginTop: spacing.sm },
  saveButton: { borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: spacing.md },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  historyLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: spacing.lg },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.md },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  historyValue: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  historyNotes: { color: colors.muted, fontSize: 11, marginTop: 2 },
  historyDate: { color: colors.muted, fontSize: 12 },
});
