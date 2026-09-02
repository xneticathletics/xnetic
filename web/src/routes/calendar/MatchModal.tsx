import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createMatch, updateMatch, deleteMatch, type MatchRow, type MatchInput } from "../../lib/api/matches";
import type { Group } from "../../lib/api/groups";

export default function MatchModal({
  match,
  defaultDate,
  groups,
  onClose,
  onSaved,
}: {
  match: MatchRow | null;
  defaultDate: string;
  groups: Group[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!match;
  const [form, setForm] = useState<MatchInput>(
    match
      ? {
          group_id: match.group_id,
          opponent_name: match.opponent_name,
          match_date: match.match_date,
          start_time: match.start_time.slice(0, 5),
          location: match.location,
          notes: match.notes,
        }
      : { group_id: "", opponent_name: "", match_date: defaultDate, start_time: "", location: null, notes: null }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof MatchInput>(key: K, value: MatchInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.group_id || !form.opponent_name.trim() || !form.match_date || !form.start_time) {
      setError("Grup, rakip takım, tarih ve saat alanları zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) await updateMatch(match.id, form);
      else await createMatch(form);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!match) return;
    if (!confirm("Bu müsabaka kaydını silmek istediğine emin misin?")) return;
    try {
      await deleteMatch(match.id);
      onSaved();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  return (
    <Modal title={isEdit ? "Müsabakayı Düzenle" : "Yeni Müsabaka"} onClose={onClose}>
      <FormField label="Grup *">
        <select className={inputClass} value={form.group_id ?? ""} onChange={(e) => set("group_id", e.target.value)}>
          <option value="">Grup seç</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Rakip Takım *">
        <input
          className={inputClass}
          value={form.opponent_name}
          onChange={(e) => set("opponent_name", e.target.value)}
          placeholder="Örn. Fenerbahçe U16"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tarih *">
          <input type="date" className={inputClass} value={form.match_date} onChange={(e) => set("match_date", e.target.value)} />
        </FormField>
        <FormField label="Saat *">
          <input type="time" className={inputClass} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </FormField>
      </div>

      <FormField label="Konum">
        <input
          className={inputClass}
          value={form.location ?? ""}
          onChange={(e) => set("location", e.target.value || null)}
          placeholder="Örn. Şehir Spor Salonu"
        />
      </FormField>

      <FormField label="Açıklama">
        <textarea className={`${inputClass} h-20`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>

      {isEdit && (
        <button onClick={handleDelete} className="mt-2 w-full rounded-lg border border-coral py-2.5 text-sm font-bold text-coral">
          Müsabakayı Sil
        </button>
      )}
    </Modal>
  );
}
