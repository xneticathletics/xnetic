import { useEffect, useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import {
  listFreezesForAthlete,
  getActiveFreezeForAthlete,
  createMembershipFreeze,
  deleteMembershipFreeze,
  type MembershipFreeze,
} from "../../lib/api/membershipFreezes";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Mobildeki src/screens/MembershipFreezeScreen.tsx ile birebir aynı —
// dondurma süresi en az 1, en fazla 3 ay olmalı (DB'de de
// membership_freezes_check kısıtı olarak zorunlu, sadece UI ipucu değil).
function addMonths(dateKey: string, months: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function MembershipFreezeSection({ athleteId }: { athleteId: string }) {
  const [freezes, setFreezes] = useState<MembershipFreeze[]>([]);
  const [active, setActive] = useState<MembershipFreeze | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(addMonths(todayKey(), 1));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([listFreezesForAthlete(athleteId), getActiveFreezeForAthlete(athleteId)])
      .then(([list, activeFreeze]) => {
        setFreezes(list);
        setActive(activeFreeze);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [athleteId]);

  const handleCreate = async () => {
    if (!startDate || !endDate) {
      setError("Başlangıç ve bitiş tarihi zorunludur.");
      return;
    }
    const minEndDate = addMonths(startDate, 1);
    const maxEndDate = addMonths(startDate, 3);
    if (endDate < minEndDate) {
      setError("Dondurma süresi en az 1 ay olmalı.");
      return;
    }
    if (endDate > maxEndDate) {
      setError("Dondurma süresi en fazla 3 ay olabilir.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createMembershipFreeze({
        athlete_id: athleteId,
        start_date: startDate,
        end_date: endDate,
        requested_by_role: "admin",
        reason: reason.trim() || null,
      });
      setShowForm(false);
      setReason("");
      load();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (freeze: MembershipFreeze) => {
    if (!confirm(`${formatDate(freeze.start_date)} - ${formatDate(freeze.end_date)} arası dondurma kaydını silmek istediğine emin misin?`)) return;
    try {
      await deleteMembershipFreeze(freeze.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-ink">Kayıt Dondurma</p>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="text-xs font-bold text-teal hover:underline">
          {showForm ? "Vazgeç" : "+ Yeni Dondurma"}
        </button>
      </div>

      {active && (
        <div className="mb-2 rounded-lg border border-yellow/40 bg-yellow/10 px-3 py-2 text-xs font-semibold text-yellow">
          ❄️ Şu an dondurulmuş: {formatDate(active.start_date)} - {formatDate(active.end_date)}
        </div>
      )}

      {showForm && (
        <div className="mb-3 rounded-lg border border-line bg-bg p-3">
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Başlangıç">
              <input
                type="date"
                className={inputClass}
                value={startDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setStartDate(d);
                  if (endDate < addMonths(d, 1)) setEndDate(addMonths(d, 1));
                }}
              />
            </FormField>
            <FormField label="Bitiş">
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Sebep (opsiyonel)">
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. sağlık, tatil…" />
          </FormField>
          {error && <p className="mb-2 text-xs font-semibold text-coral">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="w-full rounded-lg bg-yellow py-2 text-xs font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Dondurmayı Kaydet"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted">Yükleniyor…</p>
      ) : freezes.length === 0 ? (
        <p className="text-xs text-muted">Geçmiş dondurma kaydı yok.</p>
      ) : (
        <div className="space-y-1.5">
          {freezes.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-xs">
              <span>
                <span className="font-semibold text-ink">
                  {formatDate(f.start_date)} - {formatDate(f.end_date)}
                </span>
                <span className="ml-1.5 text-muted">· {f.requested_by_role === "admin" ? "Admin" : "Veli"}</span>
                {f.reason && <span className="ml-1.5 text-muted">· {f.reason}</span>}
              </span>
              <button type="button" onClick={() => handleDelete(f)} className="shrink-0 font-bold text-coral hover:underline">
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
