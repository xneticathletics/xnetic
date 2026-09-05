import { useEffect, useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import { getPlatformSettings, updatePlatformSettings } from "../../lib/api/platformSettings";

// Mobildeki SystemSettingsScreen.tsx'in web karşılığı — bu ekrandaki
// değişiklikler platformdaki TÜM kulüpleri etkiler.
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankIban, setBankIban] = useState("");

  useEffect(() => {
    getPlatformSettings()
      .then((s) => {
        setMonthlyPrice(String(s.monthlyPriceTry));
        setYearlyPrice(String(s.yearlyPriceTry));
        setMaintenanceMode(s.maintenanceMode);
        setMaintenanceMessage(s.maintenanceMessage);
        setSupportEmail(s.supportEmail ?? "");
        setSupportPhone(s.supportPhone ?? "");
        setBankAccountName(s.bankAccountName ?? "");
        setBankIban(s.bankIban ?? "");
      })
      .catch((e) => setError(e.message ?? "Ayarlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const monthly = Number(monthlyPrice.replace(",", "."));
    const yearly = Number(yearlyPrice.replace(",", "."));
    if (!monthlyPrice.trim() || Number.isNaN(monthly) || monthly <= 0) return setError("Aylık fiyat geçerli bir sayı olmalı.");
    if (!yearlyPrice.trim() || Number.isNaN(yearly) || yearly <= 0) return setError("Yıllık fiyat geçerli bir sayı olmalı.");
    if (!maintenanceMessage.trim()) return setError("Bakım mesajı boş olamaz.");

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePlatformSettings({
        monthlyPriceTry: monthly,
        yearlyPriceTry: yearly,
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
        supportEmail: supportEmail.trim() || null,
        supportPhone: supportPhone.trim() || null,
        bankAccountName: bankAccountName.trim() || null,
        bankIban: bankIban.trim() || null,
      });
      setSaved(true);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-ink">Sistem Ayarları</h1>
      <p className="mb-6 text-sm text-muted">Bu ekrandaki değişiklikler platformdaki TÜM kulüpleri etkiler.</p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}
      {saved && <p className="mb-4 text-sm font-semibold text-teal">Kaydedildi.</p>}

      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">Abonelik Fiyatları</h2>
        <FormField label="Aylık Fiyat (₺)">
          <input className={inputClass} value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} inputMode="decimal" placeholder="999" />
        </FormField>
        <FormField label="Yıllık Fiyat (₺)">
          <input className={inputClass} value={yearlyPrice} onChange={(e) => setYearlyPrice(e.target.value)} inputMode="decimal" placeholder="9990" />
        </FormField>
        <p className="text-xs italic text-muted">Kulüp Oluştur sayfasındaki plan fiyatları buradan güncellenir.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Bakım Modu</h2>
            <p className="mt-1 text-xs text-muted">
              Açıkken Süper Admin dışındaki tüm kullanıcılar bakım mesajını görür, yeni kulüp oluşturma da kapanır.
            </p>
          </div>
          <button
            onClick={() => setMaintenanceMode((v) => !v)}
            className={`h-7 w-12 shrink-0 rounded-full transition-colors ${maintenanceMode ? "bg-coral" : "bg-line"}`}
          >
            <span className={`block h-5 w-5 translate-y-1 rounded-full bg-white transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <FormField label="Bakım Mesajı">
          <textarea
            className={`${inputClass} min-h-24`}
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="Uygulama şu anda bakımda…"
          />
        </FormField>
      </div>

      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">Destek İletişim Bilgileri</h2>
        <FormField label="Destek E-postası">
          <input className={inputClass} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="destek@xnetic.net" />
        </FormField>
        <FormField label="Destek Telefonu">
          <input className={inputClass} value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="0212 000 00 00" />
        </FormField>
      </div>

      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 text-sm font-bold text-ink">Abonelik Ödeme Hesabı (Havale/EFT)</h2>
        <p className="mb-4 text-xs text-muted">
          Kulüp Oluştur sayfasında ve abonelik onayı bekleyen kulüp adminlerine bu hesap gösterilir.
        </p>
        <FormField label="Hesap Sahibi">
          <input className={inputClass} value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="X-NETIC Spor Sistemleri" />
        </FormField>
        <FormField label="IBAN">
          <input className={inputClass} value={bankIban} onChange={(e) => setBankIban(e.target.value.toUpperCase())} placeholder="TR00 0000 0000 0000 0000 0000 00" />
        </FormField>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
