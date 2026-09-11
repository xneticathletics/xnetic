import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getEvent, registerForEvent, addRegistrationReceipt, EVENT_TYPE_LABEL, type EventPaymentMethod, type EventRow } from "../lib/api/events";
import { getMyAthletes, type MyAthlete } from "../lib/api/myAthletes";
import { getClubBankInfo, type ClubBankInfo } from "../lib/api/clubSettings";
import { useAuth } from "../context/AuthContext";
import { useCopyToast } from "../hooks/useCopyToast";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventRegister">;

const METHODS: { key: EventPaymentMethod; icon: string; title: string; sub: string }[] = [
  { key: "havale", icon: "🏦", title: "Havale/EFT", sub: "Kulübün banka hesabına aktar" },
  { key: "elden", icon: "💵", title: "Elden Ödeme", sub: "Antrenörüne/yönetime elden öde" },
];

export default function EventRegisterScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const { clubId } = useAuth();
  const { copy, copiedKey } = useCopyToast();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [athletes, setAthletes] = useState<MyAthlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [method, setMethod] = useState<EventPaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [localReceipt, setLocalReceipt] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<ClubBankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([getEvent(eventId), getMyAthletes()])
      .then(([e, a]) => {
        setEvent(e);
        setAthletes(a);
        if (a.length === 1) setSelectedAthleteId(a[0].id);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!clubId) return;
    getClubBankInfo(clubId).then(setBankInfo).catch(() => {});
  }, [clubId]);

  const pickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setLocalReceipt(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!event || !selectedAthleteId) return;
    const athlete = athletes.find((a) => a.id === selectedAthleteId);
    if (!athlete) return;
    if (event.fee_try > 0 && !method) return;

    setSending(true);
    try {
      const registration = await registerForEvent(event, selectedAthleteId, athlete.full_name, method, note.trim() || null);
      if (localReceipt) {
        await addRegistrationReceipt(registration.id, localReceipt).catch(() => {});
      }
      Alert.alert(
        "Kayıt Alındı",
        event.fee_try > 0
          ? "Kaydın kulüp yönetimine iletildi. Ödemen kontrol edildikten sonra durumu güncellenecek."
          : "Kaydın onaylandı.",
        [{ text: "Tamam", onPress: () => navigation.navigate("MyEventRegistrations") }]
      );
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kayıt oluşturulamadı", [{ text: "Tamam" }]);
    } finally {
      setSending(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  const canSubmit = !!selectedAthleteId && (event.fee_try === 0 || !!method);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{EVENT_TYPE_LABEL[event.type]} · {event.title}</Text>
        <Text style={styles.summaryAmount}>{event.fee_try > 0 ? `${event.fee_try.toLocaleString("tr-TR")} ₺` : "Ücretsiz"}</Text>
      </View>

      {athletes.length > 1 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Sporcu Seç *</Text>
          <View style={styles.optionRow}>
            {athletes.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.optionChip, selectedAthleteId === a.id && styles.optionChipActive]}
                onPress={() => setSelectedAthleteId(a.id)}
              >
                <Text style={[styles.optionChipText, selectedAthleteId === a.id && styles.optionChipTextActive]}>{a.full_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.label}>Not (isteğe bağlı)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={note}
        onChangeText={setNote}
        placeholder="Eklemek istediğin bir şey var mı?"
        placeholderTextColor={colors.muted}
        multiline
      />

      {event.fee_try > 0 && (
        <>
          <Text style={styles.sectionLabel}>Ödeme Yöntemi Seç</Text>
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.methodCard, active && styles.methodCardActive]}
                onPress={() => setMethod(m.key)}
              >
                <Text style={styles.methodIcon}>{m.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{m.title}</Text>
                  <Text style={styles.methodSub}>{m.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {method === "havale" && (bankInfo?.bankAccountName || bankInfo?.bankIban) && (
            <View style={styles.detailBox}>
              {bankInfo.bankAccountName && (
                <View style={styles.bankFieldBlock}>
                  <Text style={styles.bankFieldLabel}>Hesap Sahibi</Text>
                  <View style={styles.bankFieldRow}>
                    <Text style={styles.bankFieldValue}>{bankInfo.bankAccountName}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copy("name", bankInfo.bankAccountName!)}
                      accessibilityLabel="Hesap adını kopyala"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.copyIcon}>{copiedKey === "name" ? "✓" : "📋"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {bankInfo.bankIban && (
                <View style={styles.bankFieldBlock}>
                  <Text style={styles.bankFieldLabel}>IBAN</Text>
                  <View style={styles.bankFieldRow}>
                    <Text style={styles.bankFieldValue}>{bankInfo.bankIban}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copy("iban", bankInfo.bankIban!)}
                      accessibilityLabel="IBAN'ı kopyala"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.copyIcon}>{copiedKey === "iban" ? "✓" : "📋"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {method && (
            <TouchableOpacity style={styles.receiptSlot} onPress={pickReceipt}>
              {localReceipt ? (
                <Image source={{ uri: localReceipt }} style={styles.receiptImage} resizeMode="cover" />
              ) : (
                <Text style={styles.receiptAddText}>+ Dekont Fotoğrafı Ekle (isteğe bağlı)</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={sending || !canSubmit}
      >
        {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.submitButtonText}>Kaydı Onayla</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  summaryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg,
  },
  summaryLabel: { color: colors.ink, fontSize: 15, fontWeight: "700", marginBottom: spacing.sm, textAlign: "center" },
  summaryAmount: { color: colors.yellow, fontSize: 24, fontWeight: "800" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.lg,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm },
  methodCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  methodCardActive: { borderColor: colors.yellow },
  methodIcon: { fontSize: 26 },
  methodTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  methodSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  detailBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  bankFieldBlock: { marginBottom: spacing.sm },
  bankFieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  bankFieldRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  bankFieldValue: { color: colors.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  copyButton: { padding: 6 },
  copyIcon: { fontSize: 18 },
  receiptSlot: {
    width: "100%", height: 100, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderStyle: "dashed", alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md, overflow: "hidden",
  },
  receiptImage: { width: "100%", height: "100%" },
  receiptAddText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  submitButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.surface,
  },
  optionChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  optionChipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  optionChipTextActive: { color: colors.bg },
});
