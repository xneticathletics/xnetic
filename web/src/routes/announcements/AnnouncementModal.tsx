import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createAnnouncement, type AnnouncementTarget } from "../../lib/api/announcements";
import { listGroups, type Group } from "../../lib/api/groups";

const TARGET_OPTIONS: { value: AnnouncementTarget; label: string }[] = [
  { value: "club", label: "Tüm Kulüp" },
  { value: "group", label: "Belirli Gruplar" },
  { value: "parents", label: "Veliler" },
  { value: "coaches", label: "Antrenörler" },
  { value: "athletes", label: "Sporcular" },
];

export default function AnnouncementModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetTypes, setTargetTypes] = useState<AnnouncementTarget[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGroups().then(setGroups).catch(() => {});
  }, []);

  const toggleTarget = (value: AnnouncementTarget) => {
    setTargetTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return setError("Başlık ve içerik zorunludur.");
    if (targetTypes.length === 0) return setError("En az bir hedef kitle seçmelisin.");
    if (targetTypes.includes("group") && selectedGroupIds.length === 0) return setError("En az bir grup seçmelisin.");

    setSaving(true);
    setError(null);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        target_types: targetTypes,
        target_ids: targetTypes.includes("group") ? selectedGroupIds : null,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Yayınlanamadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni Duyuru" onClose={onClose}>
      <FormField label="Başlık *">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Cumartesi maçı saat değişikliği" />
      </FormField>

      <FormField label="İçerik *">
        <textarea className={`${inputClass} h-28`} value={body} onChange={(e) => setBody(e.target.value)} />
      </FormField>

      <FormField label="Kime Gönderilsin? * (birden fazla seçebilirsin)">
        <div className="flex flex-wrap gap-2">
          {TARGET_OPTIONS.map((opt) => {
            const active = targetTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTarget(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                }`}
              >
                {active ? "✓ " : ""}
                {opt.label}
              </button>
            );
          })}
        </div>
      </FormField>

      {targetTypes.includes("group") && (
        <FormField label="Gruplar *">
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-bg p-2">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                {g.name} <span className="text-xs text-muted">· {g.branch}</span>
              </label>
            ))}
          </div>
        </FormField>
      )}

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Yayınlanıyor…" : "Yayınla"}
      </button>
    </Modal>
  );
}
