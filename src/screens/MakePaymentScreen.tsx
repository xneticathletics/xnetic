import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  notifyPaymentClaim, uploadPaymentReceipt, submitPaymentReceipt, type PaymentClaimMethod,
} from "../lib/api/payments";
import { getClubBankInfo, type ClubBankInfo } from "../lib/api/clubSettings";
import { useAuth } from "../context/AuthContext";
import { useHomeButton } from "../hooks/useHomeButton";
import { useCopyToast } from "../hooks/useCopyToast";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "MakePayment">;

type Method = PaymentClaimMethod | "online";

const METHODS: { key: Method; icon: string; title: string; sub: string }[] = [
  { key: "havale", icon: "🏦", title: "Havale/EFT", sub: "Kulübün banka hesabına aktar" },
  { key: "online", icon: "💳", title: "Online Ödeme", sub: "Kartla anında öde" },
  { key: "elden", icon: "💵", title: "Elden Ödeme", sub: "Antrenörüne/yönetime elden öde" },
];

export default function MakePaymentScreen({ route, navigation }: Props) {
  useHomeButton(navigation);
  const { clubId } = useAuth();
  const { paymentId, amount, dueDate, athleteName } = route.params;

  const [selected, setSelected] = useState<Method | null>(null);
  const [bankInfo, setBankInfo] = useState<ClubBankInfo | null>(null);
  const [bankInfoLoading, setBankInfoLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // React state güncellemesi ekrana yansıyana kadar disabled={sending} bir
  // sonraki dokunuşu engelleyemiyor (ChangePasswordScreen.tsx'te aynı bug
  // bulunup düzeltilmişti) — hızlı çift dokunuşta admine aynı bildirim iki
  // kez gidebiliyordu, senkron ref ile kilitliyoruz.
  const sendingRef = useRef(false);
  const { copy, copiedKey } = useCopyToast();

  // Sadece Havale/EFT'de anlamlı — dekont/makbuz fotoğrafı isteğe bağlı.
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) { setBankInfoLoading(false); return; }
    getClubBankInfo(clubId).then(setBankInfo).finally(() => setBankInfoLoading(false));
  }, [clubId]);

  const handlePickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Dekont fotoğrafı seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setReceiptUri(result.assets[0].uri);
  };

  const handleClaim = async (method: PaymentClaimMethod) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      let hasReceipt = false;
      if (method === "havale" && receiptUri) {
        const receiptUrl = await uploadPaymentReceipt(paymentId, receiptUri);
        await submitPaymentReceipt(paymentId, receiptUrl);
        hasReceipt = true;
      }
      await notifyPaymentClaim(paymentId, amount, athleteName, method, hasReceipt);
      Alert.alert(
        "Bildirildi",
        "Ödeme bildirimin kulüp yönetimine iletildi. Kontrol edildikten sonra durumun \"Ödendi\" olarak güncellenecek.",
        [{ text: "Tamam", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Bildirilemedi", [{ text: "Tamam" }]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{athleteName}</Text>
        <Text style={styles.summaryAmount}>{amount.toLocaleString("tr-TR")} ₺</Text>
        <Text style={styles.summaryDue}>Vade: {dueDate}</Text>
      </View>

      <Text style={styles.sectionLabel}>Ödeme Yöntemi Seç</Text>
      {METHODS.map((m) => {
        const active = selected === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.methodCard, active && styles.methodCardActive]}
            onPress={() => setSelected(m.key)}
          >
            <Text style={styles.methodIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>{m.title}</Text>
              <Text style={styles.methodSub}>{m.sub}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {selected === "havale" && (
        <View style={styles.detailBox}>
          {bankInfoLoading ? (
            <ActivityIndicator color={colors.yellow} />
          ) : bankInfo?.bankAccountName || bankInfo?.bankIban ? (
            <View style={{ alignSelf: "stretch", marginBottom: spacing.md }}>
              {bankInfo.bankAccountName && (
                <View style={styles.bankFieldBlock}>
                  <Text style={styles.bankFieldLabel}>Hesap Sahibi</Text>
                  <View style={styles.bankFieldRow}>
                    <Text style={styles.bankFieldValue}>{bankInfo.bankAccountName}</Text>
                    <View style={styles.copyAnchor}>
                      {copiedKey === "name" && (
                        <View style={styles.copiedLabel} pointerEvents="none">
                          <Text style={styles.copiedLabelText} numberOfLines={1}>Kopyalandı</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.copyButton} onPress={() => copy("name", bankInfo.bankAccountName!)}>
                        <Text style={styles.copyIcon}>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              {bankInfo.bankIban && (
                <View style={styles.bankFieldBlock}>
                  <Text style={styles.bankFieldLabel}>IBAN</Text>
                  <View style={styles.bankFieldRow}>
                    <Text style={styles.bankFieldValue}>{bankInfo.bankIban}</Text>
                    <View style={styles.copyAnchor}>
                      {copiedKey === "iban" && (
                        <View style={styles.copiedLabel} pointerEvents="none">
                          <Text style={styles.copiedLabelText} numberOfLines={1}>Kopyalandı</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.copyButton} onPress={() => copy("iban", bankInfo.bankIban!)}>
                        <Text style={styles.copyIcon}>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noInfoText}>Kulübün banka bilgisi henüz girilmemiş — yönetimle iletişime geç.</Text>
          )}
          {receiptUri ? (
            <View style={styles.receiptPreviewRow}>
              <Image source={{ uri: receiptUri }} style={styles.receiptThumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptAddedText}>Dekont eklendi</Text>
                <TouchableOpacity onPress={() => setReceiptUri(null)}>
                  <Text style={styles.receiptRemoveText}>Kaldır</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.receiptButton} onPress={handlePickReceipt} disabled={sending}>
              <Text style={styles.receiptButtonText}>📎 Dekont Ekle (isteğe bağlı)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.claimButton} onPress={() => handleClaim("havale")} disabled={sending}>
            {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.claimButtonText}>Ödedim, Bildir</Text>}
          </TouchableOpacity>
        </View>
      )}

      {selected === "elden" && (
        <View style={styles.detailBox}>
          <Text style={styles.bankInfoText}>Tutarı antrenörüne veya kulüp yönetimine elden teslim edebilirsin.</Text>
          <TouchableOpacity style={styles.claimButton} onPress={() => handleClaim("elden")} disabled={sending}>
            {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.claimButtonText}>Ödedim, Bildir</Text>}
          </TouchableOpacity>
        </View>
      )}

      {selected === "online" && (
        <View style={styles.detailBox}>
          <Text style={styles.comingSoonIcon}>🚧</Text>
          <Text style={styles.comingSoonTitle}>Yakında</Text>
          <Text style={styles.noInfoText}>
            Kartla online ödeme (iyzico) entegrasyonu yakında eklenecek. Şimdilik Havale/EFT veya Elden Ödeme seçeneklerini kullanabilirsin.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.md },
  summaryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.xl,
  },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  summaryAmount: { color: colors.yellow, fontSize: 28, fontWeight: "800", marginTop: 4 },
  summaryDue: { color: colors.muted, fontSize: 12, marginTop: 4 },
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
    borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm, alignItems: "center",
  },
  bankInfoText: { color: colors.ink, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: spacing.md },
  bankFieldBlock: { marginBottom: spacing.sm },
  bankFieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  bankFieldRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  bankFieldValue: { color: colors.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  copyAnchor: { position: "relative" },
  copyButton: { padding: 6 },
  copyIcon: { fontSize: 18 },
  copiedLabel: {
    position: "absolute", bottom: "100%", right: 0, marginBottom: 6, width: 88,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 4,
  },
  copiedLabelText: { color: colors.bg, fontSize: 11, fontWeight: "600" },
  noInfoText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: spacing.md },
  receiptButton: {
    alignSelf: "stretch", borderWidth: 1, borderColor: colors.line, borderStyle: "dashed",
    borderRadius: radius.md, paddingVertical: 12, alignItems: "center", marginBottom: spacing.md,
  },
  receiptButtonText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  receiptPreviewRow: {
    alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  receiptThumb: { width: 44, height: 44, borderRadius: radius.sm },
  receiptAddedText: { color: colors.teal, fontSize: 13, fontWeight: "700" },
  receiptRemoveText: { color: colors.coral, fontSize: 12, fontWeight: "600", marginTop: 2 },
  claimButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.xl, alignItems: "center" },
  claimButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  comingSoonIcon: { fontSize: 32, marginBottom: spacing.xs },
  comingSoonTitle: { color: colors.yellow, fontSize: 15, fontWeight: "800", marginBottom: spacing.xs },
});
