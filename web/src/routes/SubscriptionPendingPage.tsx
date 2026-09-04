import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPlatformSettings, type PlatformSettings } from "../lib/api/platformSettings";

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
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPlatformSettings().then(setSettings).catch(() => {});
  }, []);

  const copyInfo = COPY[status] ?? COPY.pending_review;

  const handleCopy = () => {
    if (!settings?.bankIban) return;
    navigator.clipboard.writeText(settings.bankIban).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        <div className="mb-3 text-4xl">{copyInfo.icon}</div>
        <h1 className="mb-2 text-xl font-extrabold text-ink">{copyInfo.title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted">{copyInfo.text}</p>

        <div className="mb-3 rounded-xl border border-line bg-bg p-4 text-left">
          <div className="text-xs font-bold uppercase text-muted">Plan</div>
          <div className="mt-1 text-base font-bold text-ink">
            {billingPeriod === "yearly" ? "Yıllık" : "Aylık"} — {amountTry.toLocaleString("tr-TR")} ₺
          </div>
        </div>

        {settings?.bankIban && (
          <div className="mb-3 rounded-xl border border-line bg-bg p-4 text-left">
            <div className="text-xs font-bold uppercase text-muted">Ödeme Hesabı</div>
            {settings.bankAccountName && <div className="mt-1 text-sm font-semibold text-ink">{settings.bankAccountName}</div>}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-yellow">{settings.bankIban}</span>
              <button onClick={handleCopy} className="text-xs font-bold text-teal hover:underline">
                {copied ? "Kopyalandı ✓" : "Kopyala"}
              </button>
            </div>
          </div>
        )}

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
