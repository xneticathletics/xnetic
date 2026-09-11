import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { inputClass } from "../components/FormField";
import { formatPhoneNumber } from "../lib/phoneFormat";
import { getPlatformSettings, type PlatformSettings } from "../lib/api/platformSettings";
import { createClub, type BillingPeriod } from "../lib/api/clubSignup";
import { uploadClubLogo } from "../lib/api/clubLogo";
import ClubAdminConsentModal from "../components/ClubAdminConsentModal";
import CaptchaWidget from "../components/CaptchaWidget";

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL as string;

type Step = "plan" | "payment" | "form";

function formatTry(amount: number): string {
  return amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

// wa.me formatı: ülke koduyla, başında "+" ya da "0" olmadan sadece rakam.
// platform_settings.support_phone serbest formatta girilebildiği için
// (0XXX... ya da +90XXX...) normalize ediyoruz.
function toWhatsappDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (!digits.startsWith("90")) digits = `90${digits}`;
  return digits;
}

// Kulüp kaydı + ödeme sadece web'den yapılıyor — mobil uygulama App Store
// kurallarına (3.1.3: uygulama içinden harici ödeme yöntemine yönlendirme
// yasağı) takılmamak için bu akışı hiç içermiyor, sadece giriş desteklerler.
// Bu sayfa mobildeki (artık kaldırılmış) CreateClubScreen.tsx'in aynı
// adımlarını web'e taşıyor.
export default function CreateClubPage() {
  const { session, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("plan");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPlatformSettings()
      .then((s) => { if (!cancelled) setPlatformSettings(s); })
      .catch((e) => { if (!cancelled) setSettingsError(e.message ?? "Bilgiler yüklenemedi"); })
      .finally(() => { if (!cancelled) setSettingsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const [clubName, setClubName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  const PLANS: { key: BillingPeriod; label: string; price: string; sub: string }[] = platformSettings
    ? [
        { key: "monthly", label: "Aylık", price: `${formatTry(platformSettings.monthlyPriceTry)} ₺ / ay`, sub: "Her ay otomatik yenilenir" },
        { key: "yearly", label: "Yıllık", price: `${formatTry(platformSettings.yearlyPriceTry)} ₺ / yıl`, sub: "2 ay ücretsiz — en avantajlı" },
      ]
    : [];

  const selectedPlan = PLANS.find((p) => p.key === billingPeriod);

  const handlePickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBack = () => {
    if (step === "payment") return setStep("plan");
    if (step === "form") return setStep("payment");
    navigate("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingPeriod) return;
    if (!clubName.trim()) return setError("Kulüp adını girmelisin.");
    if (!adminName.trim()) return setError("Adını soyadını girmelisin.");
    if (!email.trim()) return setError("E-posta adresini girmelisin.");
    if (password.length < 6) return setError("Şifre en az 6 karakter olmalı.");
    if (password !== passwordConfirm) return setError("Şifreler eşleşmiyor.");
    if (!consentAccepted) return setError("Devam etmek için KVKK Aydınlatma Metni ve Kullanım Şartları'nı kabul etmelisin.");
    if (!captchaToken) return setError("Lütfen doğrulamayı tamamla.");

    setSubmitting(true);
    setError(null);
    try {
      const { clubId } = await createClub({
        clubName: clubName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        billingPeriod,
        consentAccepted,
        captchaToken,
      });
      // Hesap oluşturulduktan hemen sonra aynı bilgilerle giriş yapılır —
      // LoginPage'deki yönlendirme, oturum gelince otomatik olarak
      // Ana Sayfa'ya geçirir.
      const { error: signInError } = await signIn(email.trim(), password, captchaToken ?? undefined);
      if (signInError) throw new Error(signInError);

      if (logoFile) {
        await uploadClubLogo(logoFile, clubId).catch(() => {
          // Logo yüklenemese bile hesap zaten kuruldu — sessizce geç, admin
          // daha sonra Kulüp Ayarları'ndan tekrar deneyebilir.
        });
      }
      navigate("/", { replace: true });
    } catch (e: any) {
      setError(e.message ?? "Kulüp oluşturulamadı");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={handleBack} className="text-sm font-semibold text-muted hover:text-ink">
            ‹ Geri
          </button>
          <div className="flex items-center gap-4">
            <a href={MARKETING_URL} className="text-sm font-semibold text-muted hover:text-ink">
              Anasayfa
            </a>
            <a href={MARKETING_URL} className="text-sm font-extrabold text-ink hover:text-yellow">
              X-NETIC
            </a>
          </div>
        </div>

        <h1 className="mb-1 text-xl font-extrabold text-ink">Kulüp Oluştur</h1>
        <p className="mb-6 text-sm text-muted">X-NETIC'e hoş geldin.</p>

        {settingsLoading && <p className="text-sm text-muted">Yükleniyor…</p>}

        {!settingsLoading && settingsError && <p className="text-sm font-semibold text-coral">{settingsError}</p>}

        {!settingsLoading && !settingsError && platformSettings?.maintenanceMode && (
          <div className="rounded-xl border border-line bg-bg p-6 text-center">
            <div className="mb-2 text-3xl">🚧</div>
            <p className="text-sm text-muted">{platformSettings.maintenanceMessage}</p>
          </div>
        )}

        {!settingsLoading && !settingsError && platformSettings && !platformSettings.maintenanceMode && step === "plan" && (
          <>
            <p className="mb-4 text-sm text-muted">Kulübün için bir plan seç.</p>
            <div className="space-y-3">
              {PLANS.map((p) => {
                const active = billingPeriod === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setBillingPeriod(p.key)}
                    className={`w-full rounded-xl border-2 p-4 text-left ${active ? "border-yellow" : "border-line"}`}
                  >
                    <div className={`text-base font-extrabold ${active ? "text-yellow" : "text-ink"}`}>{p.label}</div>
                    <div className={`mt-1 text-lg font-bold ${active ? "text-yellow" : "text-ink"}`}>{p.price}</div>
                    <div className="mt-1 text-xs text-muted">{p.sub}</div>
                  </button>
                );
              })}
            </div>
            <p className="mb-6 mt-3 text-xs italic text-muted">Fiyatlar KDV dahildir.</p>
            <button
              type="button"
              disabled={!billingPeriod}
              onClick={() => billingPeriod && setStep("payment")}
              className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-50"
            >
              Devam Et
            </button>
          </>
        )}

        {step === "payment" && selectedPlan && (
          <>
            <p className="mb-4 text-sm text-muted">Ödeme</p>
            <div className="mb-4 rounded-xl border border-line bg-bg p-4">
              <div className="text-xs font-bold uppercase text-muted">Seçilen Plan</div>
              <div className="mt-1 text-base font-bold text-ink">{selectedPlan.label} — {selectedPlan.price}</div>
            </div>

            <p className="mb-4 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
              Ödemeni tamamlamak için bizimle iletişime geç — plan ve tutarı birlikte netleştirelim.
              Ödemeni yaptıktan sonra devam edip kulüp bilgilerini gir; X-NETIC ekibi ödemeni kontrol
              edip onaylayınca hesabın hemen aktif olacak (genelde birkaç saat içinde).
            </p>

            {platformSettings?.supportPhone ? (
              <a
                href={`https://wa.me/${toWhatsappDigits(platformSettings.supportPhone)}?text=${encodeURIComponent(
                  `Merhaba, X-NETIC'te ${selectedPlan.label.toLowerCase()} plan (${selectedPlan.price}) için ödeme yapmak istiyorum.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-teal py-2.5 text-sm font-bold text-teal"
              >
                💬 WhatsApp'tan İletişime Geç
              </a>
            ) : (
              <p className="mb-6 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-coral">
                Şu an için lütfen {platformSettings?.supportEmail ?? "destek@xnetic.net"} üzerinden iletişime geç.
              </p>
            )}

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg"
            >
              Ödemeyi Yaptım, Devam Et
            </button>
          </>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit}>
            <p className="mb-4 text-sm text-muted">Kulüp Bilgileri</p>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-semibold text-muted">Kulüp Logosu (isteğe bağlı)</span>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-line bg-bg">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted">Logo</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handlePickLogo} className="text-xs text-muted" />
              </div>
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-muted">Kulüp Adı *</span>
              <input required value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Örn. Yıldız Spor Kulübü" className={inputClass} />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-muted">Adın Soyadın (Kulüp Admini) *</span>
              <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Örn. Ahmet Yılmaz" className={inputClass} />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-muted">E-posta *</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" className={inputClass} autoComplete="username" />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-muted">Telefon</span>
              <input value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} placeholder="0532-123-45-67" maxLength={14} className={inputClass} />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-muted">Şifre *</span>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" className={inputClass} autoComplete="new-password" />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-semibold text-muted">Şifre (Tekrar) *</span>
              <input required type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Şifreni tekrar gir" className={inputClass} autoComplete="new-password" />
            </label>

            <label className="mb-4 flex items-start gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <button type="button" onClick={() => setShowConsentModal(true)} className="font-semibold text-teal hover:underline">
                  KVKK Aydınlatma Metni ve Kullanım Şartları
                </button>
                'nı okudum, kabul ediyorum. *
              </span>
            </label>

            <div className="mb-4">
              <CaptchaWidget onToken={setCaptchaToken} />
            </div>

            {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

            <button type="submit" disabled={submitting || !captchaToken} className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60">
              {submitting ? "Oluşturuluyor…" : "Kulübü Oluştur"}
            </button>
          </form>
        )}

        {showConsentModal && (
          <ClubAdminConsentModal clubName={clubName} onClose={() => setShowConsentModal(false)} />
        )}

        {step === "plan" && (
          <p className="mt-6 text-center text-xs text-muted">
            Zaten bir hesabın var mı? <Link to="/login" className="font-semibold text-teal hover:underline">Giriş yap</Link>
          </p>
        )}
      </div>
    </div>
  );
}
