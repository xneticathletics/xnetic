import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createExtraIncome } from "../../lib/api/extraIncome";

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExtraIncomeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!description.trim()) return setError("Açıklama girmelisin.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Geçerli bir tutar girmelisin.");

    setSaving(true);
    setError(null);
    try {
      await createExtraIncome({ description: description.trim(), amount: amt, income_date: incomeDate });
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni Gelir" onClose={onClose}>
      <p className="mb-4 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
        Aidat dışındaki gelirler için — forma/tişört satışı, branşa özgü malzeme satışı vb.
      </p>

      <FormField label="Açıklama *">
        <input
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Örn. Forma satışı, malzeme satışı..."
        />
      </FormField>

      <FormField label="Tutar (₺) *">
        <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
      </FormField>

      <FormField label="Tarih *">
        <input type="date" className={inputClass} value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-teal py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Geliri Kaydet"}
      </button>
    </Modal>
  );
}
