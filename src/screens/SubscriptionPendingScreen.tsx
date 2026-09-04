import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { getPlatformSettings, type PlatformSettings } from "../lib/api/platformSettings";
import { useCopyToast } from "../hooks/useCopyToast";

type Props = { status: string; billingPeriod: string; amountTry: number };

const COPY: Record<string, { icon: string; title: string; text: string }> = {
  pending_review: {
    icon: "⏳",
    title: "Ödeme Onayı Bekleniyor",
    text: "Havale/EFT bildirimini aldık. X-NETIC ekibi hesabına parayı kontrol edip onayladığında hesabın hemen aktif olacak — genelde birkaç saat içinde.",
  },
  past_due: {
    icon: "⚠️",
    title: "Aboneliğinin Süresi Doldu",
    text: "Kulübünün abonelik dönemi sona erdi. Devam edebilmek için aşağıdaki hesaba ödemeni yapıp destek ile iletişime geç.",
  },
  cancelled: {
    icon: "🚫",
    title: "Abonelik İptal Edildi",
    text: "Kulübünün aboneliği iptal edilmiş görünüyor. Devam etmek istersen destek ile iletişime geç.",
  },
};

export default function SubscriptionPendingScreen({ status, billingPeriod, amountTry }: Props) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const { copy, copiedKey } = useCopyToast();

  useEffect(() => {
    getPlatformSettings().then(setSettings).catch(() => {});
  }, []);

  const copyInfo = COPY[status] ?? COPY.pending_review;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Text style={styles.icon}>{copyInfo.icon}</Text>
      <Text style={styles.title}>{copyInfo.title}</Text>
      <Text style={styles.text}>{copyInfo.text}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Plan</Text>
        <Text style={styles.cardValue}>
          {billingPeriod === "yearly" ? "Yıllık" : "Aylık"} — {amountTry.toLocaleString("tr-TR")} ₺
        </Text>
      </View>

      {settings === null ? (
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.lg }} />
      ) : settings.bankIban ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Ödeme Hesabı</Text>
          {settings.bankAccountName && <Text style={styles.cardValue}>{settings.bankAccountName}</Text>}
          <TouchableOpacity onPress={() => copy("iban", settings.bankIban!)} style={styles.ibanRow}>
            <Text style={styles.ibanText}>{settings.bankIban}</Text>
            <Text style={styles.copyHint}>{copiedKey === "iban" ? "Kopyalandı ✓" : "Kopyala"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {(settings?.supportEmail || settings?.supportPhone) && (
        <Text style={styles.support}>
          Destek: {settings.supportEmail}
          {settings.supportEmail && settings.supportPhone ? " · " : ""}
          {settings.supportPhone}
        </Text>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, alignItems: "center" },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: spacing.sm },
  text: { color: colors.muted, fontSize: 13.5, lineHeight: 20, textAlign: "center", marginBottom: spacing.xl },
  card: {
    alignSelf: "stretch", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  cardLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  cardValue: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  ibanRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  ibanText: { color: colors.yellow, fontSize: 14, fontWeight: "700", flexShrink: 1 },
  copyHint: { color: colors.teal, fontSize: 12, fontWeight: "700", marginLeft: spacing.sm },
  support: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: spacing.sm },
  signOutButton: { marginTop: spacing.xl, paddingVertical: spacing.sm },
  signOutText: { color: colors.muted, fontWeight: "600" },
});
