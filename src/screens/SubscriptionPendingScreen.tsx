import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { getPlatformSettings, type PlatformSettings } from "../lib/api/platformSettings";
import { getClubName } from "../lib/api/clubSettings";
import { notifyRenewalPaymentClaim } from "../lib/api/subscriptionStatus";

type Props = { status: string; billingPeriod: string; amountTry: number };

// wa.me formatı: ülke koduyla, başında "+" ya da "0" olmadan sadece rakam
// (web/src/routes/CreateClubPage.tsx'teki aynı yardımcı fonksiyonun kopyası
// — mobil ve web ayrı paketler, paylaşılamıyor).
function toWhatsappDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (!digits.startsWith("90")) digits = `90${digits}`;
  return digits;
}

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
  const { signOut, clubId } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    getPlatformSettings().then(setSettings).catch(() => {});
    if (clubId) getClubName(clubId).then(setClubName).catch(() => {});
  }, [clubId]);

  const copyInfo = COPY[status] ?? COPY.pending_review;

  const handleNotifyPaid = async () => {
    setNotifying(true);
    try {
      await notifyRenewalPaymentClaim(clubName ?? "Bir kulüp");
      setNotified(true);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Bildirilemedi", [{ text: "Tamam" }]);
    } finally {
      setNotifying(false);
    }
  };

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
      ) : settings.supportPhone ? (
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={() =>
            Linking.openURL(
              `https://wa.me/${toWhatsappDigits(settings.supportPhone!)}?text=${encodeURIComponent(
                `Merhaba, X-NETIC'te aboneliğimi ödemek/yenilemek istiyorum.`
              )}`
            )
          }
        >
          <Text style={styles.whatsappButtonText}>💬 WhatsApp'tan İletişime Geç</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noPhoneText}>
          Şu an için lütfen {settings?.supportEmail ?? "destek@xnetic.net"} üzerinden iletişime geç.
        </Text>
      )}

      {status === "past_due" && (
        <TouchableOpacity style={styles.paidButton} onPress={handleNotifyPaid} disabled={notifying || notified}>
          {notifying ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.paidButtonText}>{notified ? "✓ Bildirildi" : "Ödedim, Bildir"}</Text>
          )}
        </TouchableOpacity>
      )}

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
  whatsappButton: {
    alignSelf: "stretch", flexDirection: "row", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: colors.teal, borderRadius: radius.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  whatsappButtonText: { color: colors.teal, fontWeight: "700", fontSize: 14 },
  noPhoneText: { color: colors.coral, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: spacing.md },
  paidButton: {
    alignSelf: "stretch", backgroundColor: colors.yellow, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginBottom: spacing.md,
  },
  paidButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  support: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: spacing.sm },
  signOutButton: { marginTop: spacing.xl, paddingVertical: spacing.sm },
  signOutText: { color: colors.muted, fontWeight: "600" },
});
