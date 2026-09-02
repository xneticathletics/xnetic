import { useState } from "react";
import Modal from "../../components/Modal";
import { NOTIFICATION_EVENT_TYPES } from "../../lib/api/notifications";
import { updateMutedNotificationTypes, type ClubUser } from "../../lib/api/clubUsers";

export default function NotificationPrefsModal({
  user,
  onClose,
  onSaved,
}: {
  user: ClubUser;
  onClose: () => void;
  onSaved: (mutedTypes: string[]) => void;
}) {
  const [muted, setMuted] = useState<string[]>(user.muted_notification_types);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string, enabled: boolean) => {
    setMuted((prev) => (enabled ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMutedNotificationTypes(user.id, muted);
      onSaved(muted);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${user.name} — Bildirim Tercihleri`} onClose={onClose}>
      <p className="mb-4 text-xs leading-relaxed text-muted">
        Bu kişinin hangi türden bildirim alacağını sen belirliyorsun — kapattığın bir tür için bu kişiye artık hiç
        bildirim gönderilmez.
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
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </Modal>
  );
}
