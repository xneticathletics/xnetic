import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMyAthletes } from "../lib/api/myAthletes";
import { getAthlete } from "../lib/api/athletes";
import {
  listFreezesForAthlete, getActiveFreezeForAthlete, createMembershipFreeze, deleteMembershipFreeze,
  type MembershipFreeze,
} from "../lib/api/membershipFreezes";
import { useAuth } from "../context/AuthContext";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "MembershipFreeze">;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addMonths(dateKey: string, months: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function MembershipFreezeScreen({ route, navigation }: Props) {
  const isAdminEntry = !!route.params?.athleteId;
  // Admin, sporcu detayından geldiyse normal geri butonu (AthleteDetail'e
  // döner); veli/sporcu Ana Sayfa'dan geldiyse "Ana Sayfa" kısayolu
  // gösterilir. useHomeButton HER ZAMAN çağrılır (Hooks kuralı), admin
  // girişinde ise hemen ardından varsayılan geri butonuna döndürülür.
  useHomeButton(navigation);
  useEffect(() => {
    if (isAdminEntry) navigation.setOptions({ headerLeft: undefined });
  }, [isAdminEntry, navigation]);

  const { role } = useAuth();
  const { handleFocus } = useKeyboardScroll();

  const [athleteId, setAthleteId] = useState<string | null>(route.params?.athleteId ?? null);
  const [athleteName, setAthleteName] = useState<string | null>(route.params?.athleteName ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFreeze, setActiveFreeze] = useState<MembershipFreeze | null>(null);
  const [history, setHistory] = useState<MembershipFreeze[]>([]);

  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(addMonths(todayKey(), 1));
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı dondurmayı iki
  // kez oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);

  const hasLoadedOnceRef = useRef(false);

  const loadForAthlete = useCallback(async (id: string) => {
    const [active, hist] = await Promise.all([getActiveFreezeForAthlete(id), listFreezesForAthlete(id)]);
    setActiveFreeze(active);
    setHistory(hist);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          let id = route.params?.athleteId ?? null;
          if (id) {
            if (!route.params?.athleteName) {
              const a = await getAthlete(id);
              if (!cancelled && a) setAthleteName(a.full_name);
            }
          } else {
            const athletes = await getMyAthletes();
            if (athletes.length === 0) {
              if (!cancelled) setError("Bağlı bir sporcu bulunamadı.");
              return;
            }
            id = athletes[0].id;
            if (!cancelled) {
              setAthleteId(id);
              setAthleteName(athletes[0].full_name);
            }
          }
          if (id && !cancelled) await loadForAthlete(id);
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [route.params?.athleteId, route.params?.athleteName, loadForAthlete])
  );

  const minEndDate = addMonths(startDate, 1);
  const maxEndDate = addMonths(startDate, 3);

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!athleteId) return;
    if (endDate < minEndDate) {
      return Alert.alert("Süre çok kısa", "Dondurma süresi en az 1 ay olmalı.", [{ text: "Tamam" }]);
    }
    if (endDate > maxEndDate) {
      return Alert.alert("Süre çok uzun", "Dondurma süresi en fazla 3 ay olabilir.", [{ text: "Tamam" }]);
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createMembershipFreeze({
        athlete_id: athleteId,
        start_date: startDate,
        end_date: endDate,
        requested_by_role: role === "club_admin" ? "admin" : "parent",
        reason: reason.trim() || null,
      });
      await loadForAthlete(athleteId);
      setReason("");
      Alert.alert(
        "Dondurma Oluşturuldu",
        "Kayıt dondurma talebi kaydedildi ve ilgili herkese (admin, antrenör, veli/sporcu) bildirim gönderildi.",
        [{ text: "Tamam" }]
      );
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = (freeze: MembershipFreeze) => {
    Alert.alert(
      "Dondurmayı sil",
      `${formatDate(freeze.start_date)} - ${formatDate(freeze.end_date)} arası dondurma kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMembershipFreeze(freeze.id);
              if (athleteId) await loadForAthlete(athleteId);
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{athleteName}</Text>

        {activeFreeze ? (
          <View style={styles.activeBox}>
            <Text style={styles.activeBoxTitle}>🧊 Şu An Dondurulmuş</Text>
            <Text style={styles.activeBoxText}>
              {formatDate(activeFreeze.start_date)} - {formatDate(activeFreeze.end_date)}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.infoBox}>
              En az 1 ay, en fazla 3 ay dondurma yapılabilir. Onaylandığında
              admin, grubun antrenörü ve veli/sporcu hesabına bildirim gider.
            </Text>

            <Text style={styles.label}>Başlangıç Tarihi *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setStartPickerVisible(true)}>
              <Text style={{ color: colors.ink }}>{formatDate(startDate)}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Bitiş Tarihi *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setEndPickerVisible(true)}>
              <Text style={{ color: colors.ink }}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              İzin verilen aralık: {formatDate(minEndDate)} - {formatDate(maxEndDate)}
            </Text>

            <Text style={styles.label}>Not (isteğe bağlı)</Text>
            <TextInput
              onFocus={handleFocus}
              style={[styles.input, styles.inputMultiline]}
              value={reason}
              onChangeText={setReason}
              placeholder="Dondurma nedeni"
              placeholderTextColor={colors.muted}
              multiline
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Dondurmayı Kaydet</Text>}
            </TouchableOpacity>
          </>
        )}

        {history.length > 0 && (
          <>
            <Text style={styles.historyLabel}>Geçmiş Dondurmalar</Text>
            {history.map((f) => (
              <TouchableOpacity key={f.id} style={styles.historyRow} onLongPress={() => handleDelete(f)}>
                <Text style={styles.historyRange}>{formatDate(f.start_date)} - {formatDate(f.end_date)}</Text>
                <Text style={styles.historyBy}>{f.requested_by_role === "admin" ? "Admin" : "Veli"}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <DatePickerModal
          visible={startPickerVisible}
          selectedDate={startDate}
          onSelect={(d) => { setStartDate(d); if (endDate < addMonths(d, 1)) setEndDate(addMonths(d, 1)); }}
          onClose={() => setStartPickerVisible(false)}
        />
        <DatePickerModal
          visible={endPickerVisible}
          selectedDate={endDate}
          onSelect={setEndDate}
          onClose={() => setEndPickerVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  activeBox: {
    backgroundColor: colors.tealSoft, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg,
  },
  activeBoxTitle: { color: colors.teal, fontSize: 15, fontWeight: "800" },
  activeBoxText: { color: colors.ink, fontSize: 13, marginTop: 4 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  errorText: { color: colors.coral, marginTop: spacing.md, textAlign: "center" },
  saveButton: { backgroundColor: colors.coral, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  historyLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: spacing.xl, marginBottom: spacing.sm },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  historyRange: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  historyBy: { color: colors.muted, fontSize: 11 },
});
