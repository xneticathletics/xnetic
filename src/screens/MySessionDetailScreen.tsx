import React, { useCallback, useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getSession, isRpeWindowOpen, type TrainingSession } from "../lib/api/trainingSessions";
import { getMyRpe, submitRpe } from "../lib/api/sessionRpe";
import { getAttendanceStatus, type AttendanceStatus } from "../lib/api/attendance";
import { getMyExcuse, submitExcuse, cancelExcuse, type SessionExcuse } from "../lib/api/sessionExcuses";
import RpeDropdown from "../components/RpeDropdown";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "MySessionDetail">;

const STATUS_LABEL: Record<string, string> = { planned: "Planlandı", completed: "Tamamlandı", cancelled: "İptal" };

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function MySessionDetailScreen({ route }: Props) {
  const { sessionId, athleteId, athleteName } = route.params;
  const { role } = useAuth();
  // RPE (algılanan zorluk derecesi) sporcunun KENDİ hissiyatı — veli bunu
  // sporcu adına giremez, sadece görüntülemez de (bu ekranı hiç görmez).
  // "Gelemeyeceğim" bildirimi ise ikisi için de açık: küçük gruplardaki
  // sporcuların telefonu olmayabileceği için bunu veli de yapabilmeli.
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  // Antrenmana "gelmedi" olarak işaretlenmiş bir sporcuya anketi hiç
  // gösterme — katılmadığı bir antrenmanı neden değerlendirsin.
  const canSubmitRpe = role === "athlete" && attendanceStatus !== "gelmedi";

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSubmitExcuse iki kez çalışabiliyordu.
  // Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const [excuse, setExcuse] = useState<SessionExcuse | null>(null);
  const [excuseReason, setExcuseReason] = useState("");
  const [excuseSaving, setExcuseSaving] = useState(false);

  // Ana Sayfa'ya/bu ekrana her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedOnceRef.current) setLoading(true);
      (async () => {
        try {
          setError(null);
          const [s, r, e, a] = await Promise.all([
            getSession(sessionId), getMyRpe(sessionId, athleteId), getMyExcuse(sessionId, athleteId),
            getAttendanceStatus(sessionId, athleteId),
          ]);
          if (!cancelled) {
            setSession(s);
            setRpe(r);
            setExcuse(e);
            setAttendanceStatus(a);
          }
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Antrenman yüklenemedi");
        } finally {
          if (!cancelled) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
      return () => { cancelled = true; };
    }, [sessionId, athleteId])
  );

  const handleSubmitExcuse = async () => {
    if (savingRef.current) return;
    if (!excuseReason.trim()) {
      return Alert.alert("Eksik bilgi", "Gelemeyeceğinin sebebini yazmalısın.", [{ text: "Tamam" }]);
    }
    savingRef.current = true;
    setExcuseSaving(true);
    try {
      await submitExcuse(sessionId, athleteId, athleteName, excuseReason.trim());
      setExcuse({ id: "local", session_id: sessionId, athlete_id: athleteId, reason: excuseReason.trim(), created_at: new Date().toISOString() });
      setExcuseReason("");
      Alert.alert("Bildirildi", "Gelemeyeceğin antrenörüne bildirildi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Bildirilemedi", [{ text: "Tamam" }]);
    } finally {
      savingRef.current = false;
      setExcuseSaving(false);
    }
  };

  const handleCancelExcuse = () => {
    Alert.alert("Bildirimi İptal Et", "Gelemeyeceğim bildirimini geri almak istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "İptal Et", style: "destructive",
        onPress: async () => {
          setExcuseSaving(true);
          try {
            await cancelExcuse(sessionId, athleteId);
            setExcuse(null);
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "İptal edilemedi", [{ text: "Tamam" }]);
          } finally {
            setExcuseSaving(false);
          }
        },
      },
    ]);
  };

  const handleSelectRpe = async (value: number) => {
    setSaving(true);
    try {
      await submitRpe(sessionId, athleteId, value);
      setRpe(value);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setSaving(false);
    }
  };

  const rpeWindowOpen = session ? isRpeWindowOpen(session) : false;

  const handleRpePress = () => {
    if (!rpeWindowOpen) {
      Alert.alert(
        "Henüz zamanı değil",
        "Algılanan Zorluk Derecesi, antrenman başladıktan 30 dakika sonra açılır ve bitişinden 2 saat sonrasına kadar açık kalır.",
        [{ text: "Tamam" }]
      );
      return;
    }
    setDropdownVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Antrenman bulunamadı"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <View style={styles.infoTop}>
          <Text style={styles.date}>{session.session_date}</Text>
          <Text style={styles.time}>{session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}</Text>
        </View>
        <Text style={styles.venue}>{session.venues?.name ?? "Salon atanmadı"}</Text>
        {!!session.topic && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Konu</Text>
            <Text style={styles.sectionText}>{session.topic}</Text>
          </View>
        )}
        {!!session.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Program Notları</Text>
            <Text style={styles.sectionText}>{session.notes}</Text>
          </View>
        )}
        <Text style={styles.status}>{STATUS_LABEL[session.status] ?? session.status}</Text>
      </View>

      {session.status === "planned" && session.session_date >= todayKey() && (
        <View style={styles.excuseCard}>
          <Text style={styles.excuseLabel}>
            {role === "parent" ? "Çocuğun Bu Antrenmana Katılamayacak mı?" : "Bu Antrenmana Katılamayacak mısın?"}
          </Text>
          {excuse ? (
            <>
              <Text style={styles.excuseNotifiedText}>
                {role === "parent" ? "Katılamayacağını bildirdin" : "Gelemeyeceğini bildirdin"}: "{excuse.reason}"
              </Text>
              <TouchableOpacity style={styles.excuseCancelButton} onPress={handleCancelExcuse} disabled={excuseSaving}>
                {excuseSaving ? <ActivityIndicator color={colors.coral} /> : <Text style={styles.excuseCancelButtonText}>Bildirimi İptal Et</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.excuseSubtitle}>
                {role === "parent"
                  ? "Çocuğun gelemeyecekse antrenörüne sebebiyle birlikte haber ver."
                  : "Gelemeyeceksen antrenörüne sebebiyle birlikte haber ver."}
              </Text>
              <TextInput
                style={styles.excuseInput}
                value={excuseReason}
                onChangeText={setExcuseReason}
                placeholder="Örn. Hastayım, okul sınavım var..."
                placeholderTextColor={colors.muted}
                multiline
              />
              <TouchableOpacity style={styles.excuseSubmitButton} onPress={handleSubmitExcuse} disabled={excuseSaving}>
                {excuseSaving ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.excuseSubmitButtonText}>
                    {role === "parent" ? "Katılamayacağını Bildir" : "Gelemeyeceğimi Bildir"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {canSubmitRpe && (
      <View style={styles.rpeCard}>
        <Text style={styles.rpeLabel}>Algılanan Zorluk Derecesi</Text>
        <Text style={styles.rpeSubtitle}>
          {rpeWindowOpen
            ? "Bu antrenman sana ne kadar zor geldi?"
            : "Antrenman başladıktan 30 dk sonra açılır, bitişinden 2 saat sonra kapanır."}
        </Text>

        <TouchableOpacity
          style={[styles.rpeDropdownButton, !rpeWindowOpen && styles.rpeDropdownButtonDisabled]}
          onPress={handleRpePress}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.rpeDropdownText}>{rpe != null ? `${rpe} / 10` : "Seç (1-10)"}</Text>
          )}
        </TouchableOpacity>
      </View>
      )}

      <RpeDropdown
        visible={dropdownVisible}
        selected={rpe}
        onSelect={handleSelectRpe}
        onClose={() => setDropdownVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral, textAlign: "center" },
  infoCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  infoTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  date: { color: colors.ink, fontWeight: "700", fontSize: 16 },
  time: { color: colors.teal, fontWeight: "700", fontSize: 16 },
  venue: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  section: { marginTop: spacing.sm },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  sectionText: { color: colors.ink, fontSize: 14, marginTop: 2, lineHeight: 20 },
  status: { color: colors.muted, fontSize: 12, marginTop: spacing.md, fontWeight: "600" },
  excuseCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.coral,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  excuseLabel: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  excuseSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
  excuseInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, minHeight: 60, textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  excuseSubmitButton: { backgroundColor: colors.coral, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  excuseSubmitButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  excuseNotifiedText: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, marginBottom: spacing.md },
  excuseCancelButton: { borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md, paddingVertical: 12, alignItems: "center" },
  excuseCancelButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
  rpeCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.yellow,
    borderRadius: radius.lg, padding: spacing.lg,
  },
  rpeLabel: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  rpeSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
  rpeDropdownButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, alignItems: "center",
  },
  rpeDropdownButtonDisabled: { backgroundColor: colors.line },
  rpeDropdownText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
