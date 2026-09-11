import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPlatformSettings, type PlatformSettings } from "../lib/api/platformSettings";
import { getClubName } from "../lib/api/clubSettings";
import { notifyRenewalPaymentClaim } from "../lib/api/subscriptionStatus";

// wa.me formatı — CreateClubPage.tsx'teki aynı yardımcı fonksiyonun kopyası.
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

export default function SubscriptionPendingPage({
  status,
  billingPeriod,
  amountTry,
}: {
  status: string;
  billingPeriod: string;
  amountTry: number;
}) {
  const { signOut, clubId } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  useEffect(() => {
    getPlatformSettings().then(setSettings).catch(() => {});
    if (clubId) getClubName(clubId).then(setClubName).catch(() => {});
  }, [clubId]);

  const copyInfo = COPY[status] ?? COPY.pending_review;

  const handleNotifyPaid = async () => {
    setNotifying(true);
    setNotifyError(null);
    try {
      await notifyRenewalPaymentClaim(clubName ?? "Bir kulüp");
      setNotified(true);
    } catch (e) {
      setNotifyError(e instanceof Error ? e.message : "Bildirilemedi");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
        <div className="mb-3 text-4xl">{copyInfo.icon}</div>
        <h1 className="mb-2 text-xl font-extrabold text-ink">{copyInfo.title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted">{copyInfo.text}</p>

        <div className="mb-3 rounded-xl border border-line bg-bg p-4 text-left">
          <div className="text-xs font-bold uppercase text-muted">Plan</div>
          <div className="mt-1 text-base font-bold text-ink">
            {billingPeriod === "yearly" ? "Yıllık" : "Aylık"} — {amountTry.toLocaleString("tr-TR")} ₺
          </div>
        </div>

        {settings?.supportPhone ? (
          <a
            href={`https://wa.me/${toWhatsappDigits(settings.supportPhone)}?text=${encodeURIComponent(
              "Merhaba, X-NETIC'te aboneliğimi ödemek/yenilemek istiyorum."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-teal py-2.5 text-sm font-bold text-teal"
          >
            💬 WhatsApp'tan İletişime Geç
          </a>
        ) : settings ? (
          <p className="mb-3 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-coral">
            Şu an için lütfen {settings.supportEmail ?? "destek@xnetic.net"} üzerinden iletişime geç.
          </p>
        ) : null}

        {status === "past_due" && (
          <button
            onClick={handleNotifyPaid}
            disabled={notifying || notified}
            className="mb-3 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-70"
          >
            {notifying ? "Gönderiliyor…" : notified ? "✓ Bildirildi" : "Ödedim, Bildir"}
          </button>
        )}
        {notifyError && <p className="mb-3 text-xs text-coral">{notifyError}</p>}

        {(settings?.supportEmail || settings?.supportPhone) && (
          <p className="mb-6 text-xs text-muted">
            Destek: {settings.supportEmail}
            {settings.supportEmail && settings.supportPhone ? " · " : ""}
            {settings.supportPhone}
          </p>
        )}

        <button onClick={() => signOut()} className="text-sm font-semibold text-muted hover:text-ink">
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
