import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createCoachPaymentPlan } from "../../lib/api/coachPaymentPlans";
import { listCoaches, type Coach } from "../../lib/api/coaches";

export default function CoachPaymentPlanModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCoaches().then(setCoaches).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!coachId) return setError("Antrenör seçmelisiniz.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Geçerli bir tutar girin.");
    const day = Number(dayOfMonth);
    if (!day || day < 1 || day > 31) return setError("Ayın günü 1 ile 31 arasında olmalı.");

    setSaving(true);
    setError(null);
    try {
      await createCoachPaymentPlan({ coach_id: coachId, amount: amt, day_of_month: day });
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni Antrenör Ödeme Planı" onClose={onClose}>
      <p className="mb-4 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
        Burada gireceğin tutar ve gün, her ay otomatik tekrarlanan bir antrenör ödeme planı oluşturur. İlk ödeme,
        planın oluşturulduğu ay değil, bir SONRAKİ ay olarak ayarlanır. Ödeme yapıldıkça Antrenör Ödemeleri
        listesinden "Ödendi" olarak işaretleyebilirsin.
      </p>

      <FormField label="Antrenör *">
        <select className={inputClass} value={coachId} onChange={(e) => setCoachId(e.target.value)}>
          <option value="">Antrenör seç</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Aylık Tutar (₺) *">
        <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
      </FormField>

      <FormField label="Ayın Kaçında? (1-31) *">
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
        className="w-full rounded-lg bg-violet py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Ödeme Planı Oluştur"}
      </button>
    </Modal>
  );
}
