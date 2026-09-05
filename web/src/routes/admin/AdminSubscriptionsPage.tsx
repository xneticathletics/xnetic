import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { listAllSubscriptions, upsertSubscription, type SubscriptionRow } from "../../lib/api/superAdmin";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending_review", label: "Onay Bekliyor" },
  { value: "active", label: "Aktif" },
  { value: "mock_paid", label: "Test Ödemesi" },
  { value: "past_due", label: "Ödeme Gecikti" },
  { value: "cancelled", label: "İptal Edildi" },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
];
const PERIOD_LABELS: Record<string, string> = Object.fromEntries(PERIOD_OPTIONS.map((o) => [o.value, o.label]));

// Mobildeki SuperAdminSubscriptionsScreen.tsx'in web karşılığı — iyzico
// entegrasyonu hazır olana kadar Havale/EFT ödemelerini elle takip edip
// onaylamak için (bkz. project_payment_approval_flow memory'si).
export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const [editStatus, setEditStatus] = useState("active");
  const [editPeriod, setEditPeriod] = useState("monthly");
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listAllSubscriptions()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Onay bekleyen (yeni ödeme bildirimi) kayıtlar en üstte görünsün.
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.status === "pending_review" ? -1 : 0) - (b.status === "pending_review" ? -1 : 0)),
    [rows]
  );

  const openEdit = (row: SubscriptionRow) => {
    setEditing(row);
    setEditStatus(row.status === "none" ? "active" : row.status);
    setEditPeriod(row.billing_period);
    setEditAmount(row.amount_try ? String(row.amount_try) : "");
    setFormError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    const amount = Number(editAmount);
    if (!editAmount.trim() || Number.isNaN(amount) || amount < 0) return setFormError("Geçerli bir tutar gir.");
    setSaving(true);
    setFormError(null);
    try {
      await upsertSubscription({
        id: editing.id || undefined,
        club_id: editing.club_id,
        billing_period: editPeriod,
        status: editStatus,
        amount_try: amount,
      });
      setEditing(null);
      load();
    } catch (e: any) {
      setFormError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<SubscriptionRow>[] = [
    { key: "club", label: "Kulüp", render: (r) => <span className="font-semibold text-ink">{r.club_name}</span> },
    {
      key: "status",
      label: "Durum",
      render: (r) =>
        r.status === "none" ? (
          <span className="italic text-coral">Abonelik kaydı yok</span>
        ) : (
          <span className={r.status === "pending_review" ? "font-bold text-coral" : ""}>{STATUS_LABELS[r.status] ?? r.status}</span>
        ),
    },
    { key: "period", label: "Plan", render: (r) => (r.status === "none" ? "—" : PERIOD_LABELS[r.billing_period] ?? r.billing_period) },
    { key: "amount", label: "Tutar", render: (r) => (r.status === "none" ? "—" : `₺${r.amount_try.toLocaleString("tr-TR")}`) },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (r) => (
        <button onClick={() => openEdit(r)} className="text-xs font-bold text-teal hover:underline">
          {r.status === "none" ? "Oluştur" : "Düzenle"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Abonelikler</h1>
      <p className="mb-6 text-sm text-muted">Kulüplerin abonelik durumunu buradan yönetebilirsin.</p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={sortedRows} rowKey={(r) => r.club_id} loading={loading} emptyText="Henüz kulüp yok." />

      {editing && (
        <Modal title={editing.club_name} onClose={() => setEditing(null)}>
          <FormField label="Durum">
            <select className={inputClass} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Plan">
            <select className={inputClass} value={editPeriod} onChange={(e) => setEditPeriod(e.target.value)}>
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tutar (₺)">
            <input className={inputClass} value={editAmount} onChange={(e) => setEditAmount(e.target.value)} inputMode="numeric" placeholder="999" />
          </FormField>

          {formError && <p className="mb-3 text-sm font-semibold text-coral">{formError}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </Modal>
      )}
    </div>
  );
}
