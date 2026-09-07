import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

// PDF, kağıda basılabilir/e-postayla gönderilebilir resmi bir belge
// olduğu için uygulamanın koyu temasından bilerek bağımsız — sade,
// beyaz zeminli klasik bir makbuz görünümü kullanıyoruz.
function buildReceiptHtml(params: {
  clubName: string;
  athleteName: string;
  parentName?: string | null;
  period: string;
  amount: number;
  dueDate: string;
  paidAtLabel: string;
  methodLabel?: string;
  receiptNo: string;
}): string {
  const { clubName, athleteName, parentName, period, amount, dueDate, paidAtLabel, methodLabel, receiptNo } = params;
  const row = (label: string, value: string) =>
    `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a2e; padding: 40px; }
  .card { max-width: 520px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; padding: 32px; }
  .club { color: #b8860b; font-size: 18px; font-weight: 800; text-align: center; }
  .title { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-align: center; margin-top: 4px; color: #333; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 0; font-size: 13px; }
  td.label { color: #777; }
  td.value { color: #1a1a2e; font-weight: 600; text-align: right; }
  .amountLabel { text-align: center; color: #777; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-top: 8px; }
  .amount { text-align: center; color: #0f9d8c; font-size: 30px; font-weight: 800; margin-top: 4px; }
  .footer { text-align: center; color: #999; font-size: 10px; margin-top: 24px; }
</style>
</head>
<body>
  <div class="card">
    <div class="club">${clubName}</div>
    <div class="title">ÖDEME MAKBUZU</div>
    <hr />
    <table>
      ${row("Sporcu", athleteName)}
      ${parentName ? row("Veli", parentName) : ""}
      ${row("Dönem", period)}
      ${row("Vade Tarihi", dueDate)}
      ${row("Ödeme Tarihi", paidAtLabel)}
      ${methodLabel ? row("Ödeme Yöntemi", methodLabel) : ""}
      ${row("Makbuz No", receiptNo)}
    </table>
    <hr />
    <div class="amountLabel">ÖDENEN TUTAR</div>
    <div class="amount">${amount.toLocaleString("tr-TR")} ₺</div>
    <div class="footer">Bu makbuz X-NETIC üzerinden otomatik oluşturulmuştur.</div>
  </div>
</body>
</html>`;
}

export default function PaymentReceiptScreen({ route }: Props) {
  const { paymentId, amount, period, dueDate, paidAt, athleteName, parentName, method } = route.params;
  const { clubId } = useAuth();
  const [clubName, setClubName] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    getClubName(clubId).then(setClubName).catch(() => {});
  }, [clubId]);

  const handleSharePdf = async () => {
    setGenerating(true);
    try {
      const html = buildReceiptHtml({
        clubName: clubName ?? "X-NETIC",
        athleteName,
        parentName,
        period: PERIOD_LABEL[period] ?? period,
        amount,
        dueDate,
        paidAtLabel: formatDate(paidAt),
        methodLabel: method ? PAYMENT_METHOD_DB_LABEL[method] : undefined,
        receiptNo: receiptNumber(paymentId),
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        Alert.alert("Paylaşılamadı", "Bu cihazda dosya paylaşımı kullanılamıyor.", [{ text: "Tamam" }]);
      }
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Makbuz oluşturulamadı", [{ text: "Tamam" }]);
    } finally {
      setGenerating(false);
    }
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

      <TouchableOpacity style={styles.shareButton} onPress={handleSharePdf} disabled={generating}>
        {generating ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.shareButtonText}>📄 Makbuzu PDF Olarak Paylaş</Text>}
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
