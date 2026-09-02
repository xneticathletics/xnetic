import { useEffect, useState } from "react";
import { NOTIFICATION_EVENT_TYPES, type NotificationEventType } from "../../lib/api/notifications";
import {
  ROLE_BUCKETS,
  getRoleNotificationPrefs,
  applyRoleNotificationPrefs,
  type RoleBucket,
} from "../../lib/api/notificationRolePrefs";

export default function NotificationRolePrefsCard() {
  const [bucket, setBucket] = useState<RoleBucket>("club_admin");
  const [muted, setMuted] = useState<string[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRoleNotificationPrefs(bucket)
      .then(({ muted: m, memberCount: c }) => {
        setMuted(m);
        setMemberCount(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bucket]);

  const toggle = (key: string, enabled: boolean) => {
    setMuted((prev) => (enabled ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const count = await applyRoleNotificationPrefs(bucket, muted as NotificationEventType[]);
      alert(`Kaydedildi — ${count} kişiyi etkiledi.`);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-[3px] rounded-sm bg-yellow" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Bildirim Tercihleri</span>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-muted">
        Bir rol için değişiklik kaydettiğinde, o roldeki HERKESİN bildirim tercihi bu değerlerle güncellenir — kişi
        kişi değil, rol bazında yönetilir.
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {ROLE_BUCKETS.map((b) => (
          <button
            key={b.key}
            onClick={() => setBucket(b.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              bucket === b.key ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-muted">Yükleniyor…</p>
      ) : (
        <>
          <p className="mb-2 text-[11px] text-muted">
            {memberCount === 0 ? "Bu rolde şu an kimse yok." : `Bu rolde ${memberCount} kişi var.`}
          </p>
          <div className="mb-4 space-y-2">
            {NOTIFICATION_EVENT_TYPES.map((t) => {
              const enabled = !muted.includes(t.key);
              return (
                <label
                  key={t.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-2.5"
                >
                  <span className="text-sm font-semibold text-ink">{t.label}</span>
                  <input type="checkbox" checked={enabled} onChange={(e) => toggle(t.key, e.target.checked)} className="h-4 w-4 shrink-0" />
                </label>
              );
            })}
          </div>

          {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || memberCount === 0}
            className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Bu Rol İçin Kaydet"}
          </button>
        </>
      )}
    </div>
  );
}
