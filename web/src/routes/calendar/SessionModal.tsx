import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createSession, updateSession, deleteSession, type TrainingSession, type TrainingSessionInput } from "../../lib/api/trainingSessions";
import type { Group } from "../../lib/api/groups";
import type { Venue } from "../../lib/api/venues";

export default function SessionModal({
  session,
  defaultDate,
  groups,
  venues,
  onClose,
  onSaved,
}: {
  session: TrainingSession | null;
  defaultDate: string;
  groups: Group[];
  venues: Venue[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!session;
  const [form, setForm] = useState<TrainingSessionInput>(
    session
      ? {
          group_id: session.group_id,
          venue_id: session.venue_id,
          session_date: session.session_date,
          start_time: session.start_time.slice(0, 5),
          end_time: session.end_time.slice(0, 5),
          topic: session.topic,
          notes: session.notes,
        }
      : { group_id: "", venue_id: null, session_date: defaultDate, start_time: "", end_time: "", topic: null, notes: null }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TrainingSessionInput>(key: K, value: TrainingSessionInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.group_id || !form.session_date || !form.start_time || !form.end_time) {
      setError("Grup, tarih ve saat alanları zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) await updateSession(session.id, form);
      else await createSession(form);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    if (!confirm("Bu antrenmanı silmek istediğine emin misin? Bağlı yoklama/fotoğraf kayıtları da silinir.")) return;
    try {
      await deleteSession(session.id);
      onSaved();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  return (
    <Modal title={isEdit ? "Antrenmanı Düzenle" : "Yeni Antrenman"} onClose={onClose}>
      <FormField label="Grup *">
        <select className={inputClass} value={form.group_id} onChange={(e) => set("group_id", e.target.value)}>
          <option value="">Grup seç</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Salon">
        <select className={inputClass} value={form.venue_id ?? ""} onChange={(e) => set("venue_id", e.target.value || null)}>
          <option value="">Salon seçilmedi</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tarih *">
        <input type="date" className={inputClass} value={form.session_date} onChange={(e) => set("session_date", e.target.value)} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Başlangıç *">
          <input type="time" className={inputClass} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </FormField>
        <FormField label="Bitiş *">
          <input type="time" className={inputClass} value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
        </FormField>
      </div>

      <FormField label="Konu">
        <input
          className={inputClass}
          value={form.topic ?? ""}
          onChange={(e) => set("topic", e.target.value || null)}
          placeholder="Örn. Servis ve Manşet"
        />
      </FormField>

      <FormField label="Notlar">
        <textarea
          className={`${inputClass} h-20`}
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
        />
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
          Antrenmanı Sil
        </button>
      )}
    </Modal>
  );
}
