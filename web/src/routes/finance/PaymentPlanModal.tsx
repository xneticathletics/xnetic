import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createPaymentPlan } from "../../lib/api/paymentPlans";
import { listAllAthletes, type Athlete } from "../../lib/api/athletes";

export default function PaymentPlanModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllAthletes().then(setAthletes).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!athleteId) return setError("Sporcu seçmelisiniz.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Geçerli bir tutar girin.");
    const day = Number(dayOfMonth);
    if (!day || day < 1 || day > 28) return setError("Ayın günü 1 ile 28 arasında olmalı.");

    setSaving(true);
    setError(null);
    try {
      await createPaymentPlan({ athlete_id: athleteId, amount: amt, day_of_month: day });
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni Aidat Planı" onClose={onClose}>
      <p className="mb-4 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
        Burada gireceğin tutar ve gün, her ay otomatik tekrarlanan bir aidat planı oluşturur. Önümüzdeki 3 ay için
        ödeme kaydı hemen hazırlanır; süre ilerledikçe yeni aylar kendiliğinden eklenir.
      </p>

      <FormField label="Sporcu *">
        <select className={inputClass} value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
          <option value="">Sporcu seç</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Aylık Tutar (₺) *">
        <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
      </FormField>

      <FormField label="Ayın Kaçında? (1-28) *">
        <input
          type="number"
          className={inputClass}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          placeholder="Örn. 5"
        />
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Aidat Planı Oluştur"}
      </button>
    </Modal>
  );
}
