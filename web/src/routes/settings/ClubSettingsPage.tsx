import { useEffect, useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import { getClubSettings, updateClubSettings, getClubName, updateClubName, type ClubSettings } from "../../lib/api/clubSettings";
import { getClubLogoUrl, uploadClubLogo } from "../../lib/api/clubLogo";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-2">
      <span className="h-3 w-[3px] rounded-sm bg-yellow" />
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
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

export default function ClubSettingsPage() {
  const [form, setForm] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clubName, setClubNameState] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(getClubLogoUrl());
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    getClubSettings().then(setForm).catch((e) => setError(e.message)).finally(() => setLoading(false));
    getClubName().then((n) => setClubNameState(n ?? ""));
  }, []);

  const set = (key: keyof ClubSettings, value: number) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      await updateClubSettings(form);
      alert("Ayarlar güncellendi.");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!clubName.trim()) return;
    setNameSaving(true);
    try {
      await updateClubName(clubName.trim());
      alert("Kulüp adı güncellendi.");
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setNameSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const url = await uploadClubLogo(file);
      setLogoUrl(url);
    } catch (e: any) {
      alert(e.message ?? "Yüklenemedi");
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading || !form) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-ink">Kulüp Ayarları</h1>

      <SectionHeader title="Kulüp Kimliği" />
      <div className="flex items-center gap-5 rounded-xl border border-line bg-surface p-4">
        <img src={logoUrl} alt="Kulüp logosu" className="h-20 w-20 rounded-xl border border-line object-contain" />
        <div className="flex-1">
          <label className="mb-2 inline-block cursor-pointer rounded-lg border border-teal px-3 py-2 text-xs font-bold text-teal">
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

      <SectionHeader title="Yoklama & Antrenman Tamamlama" />
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

      <SectionHeader title="Antrenör Yönetimi" />
      <NumberField
        label="Grup Başına Yardımcı Antrenör Limiti"
        value={form.assistant_coach_limit}
        onChange={(v) => set("assistant_coach_limit", v)}
      />

      <SectionHeader title="Aidat & Finans" />
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

      <SectionHeader title="Duyurular" />
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

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 mb-10 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
