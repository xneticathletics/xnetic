import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createExpense } from "../../lib/api/expenses";

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!description.trim()) return setError("Açıklama girmelisin.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Geçerli bir tutar girmelisin.");

    setSaving(true);
    setError(null);
    try {
      await createExpense({ description: description.trim(), amount: amt, expense_date: expenseDate });
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni Gider" onClose={onClose}>
      <FormField label="Açıklama *">
        <input
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Örn. Salon kirası, malzeme alımı..."
        />
      </FormField>

      <FormField label="Tutar (₺) *">
        <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
      </FormField>

      <FormField label="Tarih *">
        <input type="date" className={inputClass} value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-coral py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Gideri Kaydet"}
      </button>
    </Modal>
  );
}
