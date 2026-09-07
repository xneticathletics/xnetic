import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getClubName } from "../lib/api/clubSettings";
import { PAYMENT_METHOD_DB_LABEL } from "../lib/api/payments";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "PaymentReceipt">;

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

// Ayrı bir makbuz kaydı/numaralandırma sistemi yok — payment satırı zaten
// tek ve kalıcı bir kimliğe sahip (id), makbuz numarasını buradan türetiyoruz.
function receiptNumber(paymentId: string): string {
  return `MK-${paymentId.slice(0, 8).toUpperCase()}`;
}

export default function PaymentReceiptScreen({ route }: Props) {
  const { paymentId, amount, period, dueDate, paidAt, athleteName, parentName, method } = route.params;
  const { clubId } = useAuth();
  const [clubName, setClubName] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    getClubName(clubId).then(setClubName).catch(() => {});
  }, [clubId]);

  const handleShare = () => {
    const lines = [
      clubName ?? "X-NETIC",
      "ÖDEME MAKBUZU",
      "",
      `Sporcu: ${athleteName}`,
      ...(parentName ? [`Veli: ${parentName}`] : []),
      `Dönem: ${PERIOD_LABEL[period] ?? period}`,
      `Tutar: ${amount.toLocaleString("tr-TR")} ₺`,
      `Vade Tarihi: ${dueDate}`,
      `Ödeme Tarihi: ${formatDate(paidAt)}`,
      ...(method ? [`Ödeme Yöntemi: ${PAYMENT_METHOD_DB_LABEL[method]}`] : []),
      `Makbuz No: ${receiptNumber(paymentId)}`,
    ];
    Share.share({ message: lines.join("\n") }).catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.card}>
        <Text style={styles.clubName}>{clubName ?? "—"}</Text>
        <Text style={styles.title}>ÖDEME MAKBUZU</Text>

        <View style={styles.divider} />

        <Row label="Sporcu" value={athleteName} />
        {!!parentName && <Row label="Veli" value={parentName} />}
        <Row label="Dönem" value={PERIOD_LABEL[period] ?? period} />
        <Row label="Vade Tarihi" value={dueDate} />
        <Row label="Ödeme Tarihi" value={formatDate(paidAt)} />
        {!!method && <Row label="Ödeme Yöntemi" value={PAYMENT_METHOD_DB_LABEL[method]} />}
        <Row label="Makbuz No" value={receiptNumber(paymentId)} />

        <View style={styles.divider} />

        <Text style={styles.amountLabel}>ÖDENEN TUTAR</Text>
        <Text style={styles.amount}>{amount.toLocaleString("tr-TR")} ₺</Text>

        <Text style={styles.footer}>Bu makbuz X-NETIC üzerinden otomatik oluşturulmuştur.</Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>📤 Paylaş</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: "center",
  },
  clubName: { color: colors.yellow, fontSize: 16, fontWeight: "800" },
  title: { color: colors.ink, fontSize: 13, fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  divider: { alignSelf: "stretch", height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  row: { alignSelf: "stretch", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  amountLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  amount: { color: colors.teal, fontSize: 30, fontWeight: "800", marginTop: 4 },
  footer: { color: colors.muted, fontSize: 11, textAlign: "center", marginTop: spacing.lg },
  shareButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14,
    alignItems: "center", marginTop: spacing.lg,
  },
  shareButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
});
