import { useEffect, useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import {
  getClubSettings,
  updateClubSettings,
  getClubName,
  updateClubName,
  getClubBankInfo,
  updateClubBankInfo,
  type ClubSettings,
} from "../../lib/api/clubSettings";
import { getClubLogoUrl, uploadClubLogo } from "../../lib/api/clubLogo";
import { useAuth } from "../../context/AuthContext";
import { useClubSettings } from "../../context/ClubSettingsContext";
import { exportClubData } from "../../lib/clubExport";

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-[3px] rounded-sm bg-yellow" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <FormField label={label}>
      <input
        type="number"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </FormField>
  );
}

// Sol menüdeki hangi bölümün hangi anahtara bağlı olduğu — Sidebar.tsx'teki
// tileKey eşlemesiyle birebir aynı, mobildeki club_admin ana sayfa
// başlıklarıyla aynı anahtarları kullanır (bkz. src/screens/HomeScreen.tsx).
const TOGGLEABLE_TILES: { key: string; label: string; hint?: string; icon: string }[] = [
  { key: "sporcu", label: "Sporcu Yönetimi", hint: "Sporcular ve Gruplar bölümleri", icon: "👥" },
  { key: "antrenorler", label: "Antrenörler", icon: "🧑‍🏫" },
  { key: "antrenman", label: "Antrenman ve Müsabaka Takvimi", icon: "📅" },
  { key: "kulup_yapisi", label: "Kulüp Yapısı", hint: "Branşlar ve Salonlar bölümleri", icon: "🏛️" },
  { key: "aidat", label: "Finans", icon: "💰" },
  { key: "performans", label: "Performans Ölçümleri", icon: "⏱️" },
  { key: "beslenme", label: "Beslenme", icon: "🥗" },
  { key: "fitness", label: "Fitness", icon: "💪" },
  { key: "magaza", label: "Mağaza", icon: "🛍️" },
];

export default function ClubSettingsPage() {
  const { clubId } = useAuth();
  const { refresh: refreshClubSettings } = useClubSettings();
  const [form, setForm] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clubName, setClubNameState] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(clubId ? getClubLogoUrl(clubId) : "");
  const [logoUploading, setLogoUploading] = useState(false);

  const [bankAccountName, setBankAccountName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSaving, setBankSaving] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) {
      setError("Kulüp bulunamadı");
      setLoading(false);
      return;
    }
    getClubSettings(clubId).then(setForm).catch((e) => setError(e.message)).finally(() => setLoading(false));
    getClubName(clubId).then((n) => setClubNameState(n ?? ""));
    getClubBankInfo(clubId).then((b) => {
      setBankAccountName(b.bankAccountName ?? "");
      setBankIban(b.bankIban ?? "");
    });
  }, [clubId]);

  const set = (key: keyof ClubSettings, value: number) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const toggleTile = (key: string, enabled: boolean) => {
    if (!form) return;
    const next = enabled ? form.disabled_home_tiles.filter((k) => k !== key) : [...form.disabled_home_tiles, key];
    setForm({ ...form, disabled_home_tiles: next });
  };

  const handleSave = async () => {
    if (!form || !clubId) return;
    setSaving(true);
    setError(null);
    try {
      await updateClubSettings(clubId, form);
      await refreshClubSettings();
      alert("Ayarlar güncellendi.");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!clubName.trim() || !clubId) return;
    setNameSaving(true);
    try {
      await updateClubName(clubId, clubName.trim());
      alert("Kulüp adı güncellendi.");
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setNameSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!clubId) return;
    setLogoUploading(true);
    try {
      const url = await uploadClubLogo(file, clubId);
      setLogoUrl(url);
    } catch (e: any) {
      alert(e.message ?? "Yüklenemedi");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveBankInfo = async () => {
    if (!clubId) return;
    setBankSaving(true);
    try {
      await updateClubBankInfo(clubId, bankAccountName.trim(), bankIban.trim());
      alert("Banka bilgileri güncellendi.");
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setBankSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await exportClubData();
    } catch (e: any) {
      setExportError(e.message ?? "Dışa aktarılamadı");
    } finally {
      setExporting(false);
    }
  };

  if (loading || !form) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-ink">Kulüp Ayarları</h1>

      <SettingsCard title="Kulüp Kimliği">
        <div className="flex items-center gap-5">
          <img src={logoUrl} alt="Kulüp logosu" className="h-20 w-20 rounded-xl border border-line object-contain" />
          <label className="inline-block cursor-pointer rounded-lg border border-teal px-3 py-2 text-xs font-bold text-teal">
            {logoUploading ? "Yükleniyor…" : "Logoyu Değiştir"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={logoUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />
          </label>
        </div>

        <FormField label="Kulüp Adı">
          <div className="flex gap-2">
            <input className={inputClass} value={clubName} onChange={(e) => setClubNameState(e.target.value)} placeholder="Örn. X-NETIC Spor Kulübü" />
            <button
              onClick={handleSaveName}
              disabled={nameSaving}
              className="shrink-0 rounded-lg border border-teal px-4 text-sm font-bold text-teal disabled:opacity-60"
            >
              {nameSaving ? "…" : "Kaydet"}
            </button>
          </div>
        </FormField>
      </SettingsCard>

      <SettingsCard title="Banka Bilgileri">
        <p className="text-[11px] text-muted">Havale/EFT ile aidat ödeyecek velilere gösterilir.</p>
        <FormField label="Hesap Adı">
          <input
            className={inputClass}
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            placeholder="Örn. X-NETIC Spor Kulübü Derneği"
          />
        </FormField>
        <FormField label="IBAN">
          <input
            className={inputClass}
            value={bankIban}
            onChange={(e) => setBankIban(e.target.value)}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
          />
        </FormField>
        <button
          onClick={handleSaveBankInfo}
          disabled={bankSaving}
          className="rounded-lg border border-teal px-4 py-2 text-sm font-bold text-teal disabled:opacity-60"
        >
          {bankSaving ? "…" : "Banka Bilgilerini Kaydet"}
        </button>
      </SettingsCard>

      <SettingsCard title="Ana Sayfa Özellikleri">
        <p className="text-[11px] text-muted">
          Kulübünün kullanmadığı bölümleri kapatabilirsin — ör. Beslenme'ye ihtiyacın yoksa kapat, ihtiyaç olduğunda
          tekrar aç. Kapatılan bölümler sol menüde hiç görünmez. En alttaki "Kaydet" ile uygulanır.
        </p>
        <div className="space-y-2">
          {TOGGLEABLE_TILES.map((tile) => {
            const enabled = !form.disabled_home_tiles.includes(tile.key);
            return (
              <label
                key={tile.key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-2.5"
              >
                <span className="flex items-center gap-2.5">
                  <span>{tile.icon}</span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{tile.label}</span>
                    {tile.hint && <span className="block text-[11px] text-muted">{tile.hint}</span>}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggleTile(tile.key, e.target.checked)}
                  className="h-4 w-4 shrink-0"
                />
              </label>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Yoklama & Antrenman Tamamlama">
        <NumberField
          label="Yoklama Al — Antrenmandan Kaç Dakika Önce Açılsın"
          value={form.attendance_window_before_minutes}
          onChange={(v) => set("attendance_window_before_minutes", v)}
        />
        <NumberField
          label="Yoklama Al — Antrenman Başladıktan Kaç Dakika Sonra Kapansın"
          value={form.attendance_window_after_minutes}
          onChange={(v) => set("attendance_window_after_minutes", v)}
        />
        <NumberField
          label="Antrenmanı Tamamlandı İşaretleme — Bitişe Kaç Dakika Kala Açılsın"
          value={form.completion_window_before_minutes}
          onChange={(v) => set("completion_window_before_minutes", v)}
        />
        <NumberField
          label="Antrenman Bitişinden Kaç Dakika Sonra Otomatik Tamamlansın"
          hint="Uygulama açıldığında, bu süre geçmiş antrenmanlar otomatik 'Tamamlandı' işaretlenir."
          value={form.auto_complete_after_minutes}
          onChange={(v) => set("auto_complete_after_minutes", v)}
        />
      </SettingsCard>

      <SettingsCard title="Antrenör Yönetimi">
        <NumberField
          label="Grup Başına Yardımcı Antrenör Limiti"
          value={form.assistant_coach_limit}
          onChange={(v) => set("assistant_coach_limit", v)}
        />
      </SettingsCard>

      <SettingsCard title="Aidat & Finans">
        <NumberField
          label="Aidat Planı — Önümüzdeki Kaç Ay Otomatik Oluşturulsun"
          value={form.payment_plan_months_ahead}
          onChange={(v) => set("payment_plan_months_ahead", v)}
        />
        <NumberField
          label="Vadesi Geçen Ödeme — Kaç Gün Sonra 'Gecikmiş' Sayılsın"
          hint="0 = vade tarihi geçer geçmez hemen gecikmiş sayılır."
          value={form.payment_overdue_grace_days}
          onChange={(v) => set("payment_overdue_grace_days", v)}
        />
        <NumberField
          label="Finansal Dönem Başlangıç Günü (Ayın Kaçı)"
          hint="Finansal Dökümanlarım'daki varsayılan tarih aralığı, her ay bu günden bugüne kadar hesaplanır. Varsayılan 1 = takvim ayı."
          value={form.finance_period_start_day}
          onChange={(v) => set("finance_period_start_day", v)}
        />
      </SettingsCard>

      <SettingsCard title="Duyurular">
        <NumberField
          label="Ana Sayfa Önizlemesi — Duyuru Kaç Gün Görünsün"
          value={form.announcement_home_preview_days}
          onChange={(v) => set("announcement_home_preview_days", v)}
        />
        <NumberField
          label="Duyurular Listesi — Duyuru Kaç Gün Görünsün"
          value={form.announcement_visibility_days}
          onChange={(v) => set("announcement_visibility_days", v)}
        />
      </SettingsCard>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mb-5 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>

      <SettingsCard title="Kulüp Bilgilerini Dışa Aktar">
        <p className="text-[11px] text-muted">
          Sporcu, antrenör, grup, branş ve salon bilgilerini tek bir Excel dosyası olarak indir — her biri ayrı bir
          sayfada. Aidat/sipariş gibi finansal veriler bu dosyaya dahil değildir.
        </p>
        {exportError && <p className="text-sm font-semibold text-coral">{exportError}</p>}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full rounded-lg bg-teal py-2.5 text-sm font-bold text-bg disabled:opacity-60"
        >
          {exporting ? "Hazırlanıyor…" : "📤 Excel Olarak Dışa Aktar"}
        </button>
      </SettingsCard>

      <div className="mb-10" />
    </div>
  );
}
