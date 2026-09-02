import React, { useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyAthletes } from "../lib/api/myAthletes";
import {
  getCheckinForDate, upsertWellnessCheckin, listCheckinsForAthlete, type WellnessCheckin,
} from "../lib/api/wellnessCheckins";
import ScaleSelector from "../components/ScaleSelector";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "WellnessCheckin">;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Check-in girişi sadece sabah 06:00-12:00 arası açık — bu saat aralığının
// dışında form pasif olur, sadece geçmiş görüntülenebilir.
function isWithinCheckinWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 12;
}

export default function WellnessCheckinScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [athleteType, setAthleteType] = useState<"spor_okulu" | "musabik" | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışabiliyordu. Senkron bir
  // ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [restingHr, setRestingHr] = useState("");

  const [history, setHistory] = useState<WellnessCheckin[]>([]);

  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          const athletes = await getMyAthletes();
          if (athletes.length === 0) {
            if (!cancelled) setError("Bağlı bir sporcu bulunamadı.");
            return;
          }
          const a = athletes[0];
          if (cancelled) return;
          setAthleteId(a.id);
          setAthleteName(a.full_name);
          setAthleteType(a.athlete_type);

          if (a.athlete_type !== "musabik") return;

          const [today, recent] = await Promise.all([
            getCheckinForDate(a.id, todayKey()),
            listCheckinsForAthlete(a.id, 14),
          ]);
          if (cancelled) return;
          if (today) {
            setSleepHours(today.sleep_hours != null ? String(today.sleep_hours) : "");
            setSleepQuality(today.sleep_quality);
            setSoreness(today.soreness);
            setEnergy(today.energy);
            setMood(today.mood);
            setRestingHr(today.resting_hr != null ? String(today.resting_hr) : "");
          }
          setHistory(recent);
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!athleteId) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await upsertWellnessCheckin({
        athlete_id: athleteId,
        checkin_date: todayKey(),
        sleep_hours: sleepHours.trim() ? Number(sleepHours.trim().replace(",", ".")) : null,
        sleep_quality: sleepQuality,
        soreness,
        energy,
        mood,
        resting_hr: restingHr.trim() ? Number(restingHr.trim()) : null,
      });
      setHistory(await listCheckinsForAthlete(athleteId, 14));
      Alert.alert("Kaydedildi", "Bugünkü check-in'in kaydedildi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error && !athleteId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (athleteType !== "musabik") {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.placeholderIcon}>🌡️</Text>
        <Text style={styles.placeholderTitle}>Sadece Müsabık Sporcular İçin</Text>
        <Text style={styles.errorText}>
          Günlük Check-in, şu an sadece müsabık sporcular için kullanılabilir.
        </Text>
      </View>
    );
  }

  const withinWindow = isWithinCheckinWindow();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{athleteName} — {formatDate(todayKey())}</Text>

        {!withinWindow ? (
          <Text style={styles.inactiveBox}>
            ⏰ Check-in girişi sadece sabah 06:00-12:00 arası açıktır. Şu an
            pasif — geçmiş kayıtlarını aşağıdan görebilirsin.
          </Text>
        ) : (
          <Text style={styles.infoBox}>
            Bu, resmi bir test değil — kişisel bir günlük. Antrenörün trendleri
            görüp erken uyarı alabilmesi için her gün 30 saniyede doldurman yeterli.
          </Text>
        )}

        {withinWindow && (
        <>
        <Field label="Uyku Süresi (saat)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={sleepHours}
            onChangeText={setSleepHours}
            keyboardType="numeric"
            placeholder="Örn. 7.5"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Uyku Kalitesi">
          <ScaleSelector value={sleepQuality} onChange={setSleepQuality} lowLabel="Kötü" highLabel="Mükemmel" activeColor={colors.teal} />
        </Field>

        <Field label="Kas Ağrısı / Yorgunluk">
          <ScaleSelector value={soreness} onChange={setSoreness} lowLabel="Çok yorgun" highLabel="Hiç yok" activeColor={colors.coral} />
        </Field>

        <Field label="Enerji Seviyesi">
          <ScaleSelector value={energy} onChange={setEnergy} lowLabel="Düşük" highLabel="Yüksek" activeColor={colors.yellow} />
        </Field>

        <Field label="Stres / Ruh Hali">
          <ScaleSelector value={mood} onChange={setMood} lowLabel="Kötü / Stresli" highLabel="İyi / Sakin" activeColor={colors.violet} />
        </Field>

        <Field label="Dinlenme Kalp Atış Hızı (isteğe bağlı)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={restingHr}
            onChangeText={setRestingHr}
            keyboardType="numeric"
            placeholder="Örn. 62"
            placeholderTextColor={colors.muted}
          />
        </Field>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>
        </>
        )}

        {history.length > 0 && (
          <>
            <Text style={styles.historyLabel}>Son Kayıtlar</Text>
            {history.map((h) => (
              <View key={h.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{formatDate(h.checkin_date)}</Text>
                <View style={styles.historyMetrics}>
                  {h.sleep_quality != null && <Text style={styles.historyMetric}>😴 {h.sleep_quality}</Text>}
                  {h.energy != null && <Text style={styles.historyMetric}>⚡ {h.energy}</Text>}
                  {h.soreness != null && <Text style={styles.historyMetric}>💪 {h.soreness}</Text>}
                  {h.mood != null && <Text style={styles.historyMetric}>🙂 {h.mood}</Text>}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  placeholderIcon: { fontSize: 36, marginBottom: spacing.sm },
  placeholderTitle: { color: colors.yellow, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs, textAlign: "center" },
  inactiveBox: {
    color: colors.coral, fontSize: 12, lineHeight: 18, backgroundColor: colors.coralSoft,
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  errorText: { color: colors.coral, marginBottom: spacing.md, textAlign: "center" },
  saveButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  historyLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: spacing.xl, marginBottom: spacing.sm },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  historyDate: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  historyMetrics: { flexDirection: "row", gap: spacing.sm },
  historyMetric: { color: colors.muted, fontSize: 12 },
});
