import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { createCoachAdvance } from "../../lib/api/coachAdvances";
import { listPendingCoachPaymentsFor, type CoachPayment } from "../../lib/api/coachPayments";
import { listCoaches, type Coach } from "../../lib/api/coaches";

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTL(n: number) {
  return `${Number(n).toLocaleString("tr-TR")} ₺`;
}

export default function CoachAdvanceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachId, setCoachId] = useState("");
  const [amount, setAmount] = useState("");
  const [givenDate, setGivenDate] = useState(todayKey());
  const [note, setNote] = useState("");

  const [pendingPayments, setPendingPayments] = useState<CoachPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCoaches().then(setCoaches).catch(() => {});
  }, []);

  const handleSelectCoach = async (id: string) => {
    setCoachId(id);
    setPendingPayments([]);
    if (!id) return;
    setLoadingPayments(true);
    try {
      setPendingPayments(await listPendingCoachPaymentsFor(id));
    } catch (e: any) {
      setError(e.message ?? "Ödemeler yüklenemedi");
    } finally {
      setLoadingPayments(false);
    }
  };

  const advanceAmount = Number(amount) || 0;
  // Kesinti her zaman antrenörün sıradaki (en yakın vadeli) bekleyen
  // ödemesinden yapılır — mobildeki CoachAdvanceFormScreen ile birebir aynı.
  const nextPayment = pendingPayments[0] ?? null;
  const deductedFromNext = nextPayment ? Math.min(advanceAmount, Number(nextPayment.amount)) : 0;

  const handleSave = async () => {
    if (!coachId) return setError("Bir antrenör seçmelisin.");
    if (!advanceAmount || advanceAmount <= 0) return setError("Geçerli bir avans tutarı girmelisin.");

    setSaving(true);
    setError(null);
    try {
      await createCoachAdvance(
        { coach_id: coachId, amount: advanceAmount, given_date: givenDate, note: note.trim() || null },
        nextPayment && deductedFromNext > 0 ? { coach_payment_id: nextPayment.id, deducted_amount: deductedFromNext } : null
      );
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Avans Ver" onClose={onClose}>
      <p className="mb-4 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
        Antrenöre verdiğin avansı kaydet — tutar otomatik olarak antrenörün sıradaki (en yakın vadeli) bekleyen
        ödemesinden düşülür.
      </p>

      <FormField label="Antrenör *">
        <select className={inputClass} value={coachId} onChange={(e) => handleSelectCoach(e.target.value)}>
          <option value="">Antrenör seç</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Avans Tutarı (₺) *">
        <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
      </FormField>

      <FormField label="Tarih *">
        <input type="date" className={inputClass} value={givenDate} onChange={(e) => setGivenDate(e.target.value)} />
      </FormField>

      <FormField label="Not (isteğe bağlı)">
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. Nakit elden verildi" />
      </FormField>

      {coachId && (
        <div className="mb-4 rounded-lg border border-line bg-bg p-3">
          <p className="mb-1 text-xs font-bold text-ink">Sıradaki Ödemeden Kesinti</p>
          {loadingPayments ? (
            <p className="text-xs text-muted">Yükleniyor…</p>
          ) : !nextPayment ? (
            <p className="text-xs text-muted">Bu antrenörün bekleyen ödemesi yok, avans kesintisiz kaydedilecek.</p>
          ) : (
            <>
              <p className="text-xs text-muted">Vade: {new Date(nextPayment.due_date).toLocaleDateString("tr-TR")}</p>
              <p className="text-sm font-bold text-ink">{formatTL(nextPayment.amount)}</p>
              {advanceAmount > 0 && (
                <p className={`mt-1 text-xs ${advanceAmount > Number(nextPayment.amount) ? "font-semibold text-coral" : "text-muted"}`}>
                  {advanceAmount > Number(nextPayment.amount)
                    ? `Avans tutarı bu ödemeden büyük, kesinti ${formatTL(deductedFromNext)} ile sınırlı kalacak.`
                    : `Kesinti sonrası bu ödeme: ${formatTL(Number(nextPayment.amount) - deductedFromNext)}`}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-violet py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Avansı Kaydet"}
      </button>
    </Modal>
  );
}
