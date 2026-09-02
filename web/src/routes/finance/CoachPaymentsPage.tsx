import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listCoachPayments, markCoachPaymentPaid, markCoachPaymentPending, deleteCoachPayment, type CoachPayment,
} from "../../lib/api/coachPayments";
import { topUpAllActiveCoachPlans } from "../../lib/api/coachPaymentPlans";
import CoachPaymentPlanModal from "./CoachPaymentPlanModal";
import CoachAdvanceModal from "./CoachAdvanceModal";

type StatusFilter = "all" | "pending" | "paid";

function formatTL(n: number) {
  return `${Number(n).toLocaleString("tr-TR")} ₺`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function CoachPaymentsPage() {
  const [payments, setPayments] = useState<CoachPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setError(null);
      await topUpAllActiveCoachPlans();
      setPayments(await listCoachPayments());
    } catch (e: any) {
      setError(e.message ?? "Ödemeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    let pending = 0;
    let paid = 0;
    payments.forEach((p) => {
      if (p.status === "paid") paid += Number(p.amount);
      else pending += Number(p.amount);
    });
    return { pending, paid };
  }, [payments]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? payments : payments.filter((p) => p.status === statusFilter)),
    [payments, statusFilter]
  );

  const handleTogglePaid = async (item: CoachPayment) => {
    const isPending = item.status === "pending";
    const message = isPending
      ? `${item.users?.name ?? "Antrenör"} için ${formatTL(item.amount)} tutarındaki ödemeyi ödendi olarak işaretlemek istediğine emin misin?`
      : "Bu ödemeyi tekrar bekliyor durumuna almak istediğine emin misin?";
    if (!confirm(message)) return;
    try {
      if (isPending) await markCoachPaymentPaid(item.id);
      else await markCoachPaymentPending(item.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "İşlem başarısız");
    }
  };

  const handleDelete = async (item: CoachPayment) => {
    if (!confirm(`${item.users?.name ?? "Antrenör"} için ${formatTL(item.amount)} tutarındaki kaydı silmek istediğine emin misin?`)) return;
    try {
      await deleteCoachPayment(item.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<CoachPayment>[] = [
    {
      key: "coach",
      label: "Antrenör",
      render: (p) => (
        <div>
          <span className="font-semibold">{p.users?.name ?? "Antrenör"}</span>
          {!!p.notes && <p className="mt-0.5 text-xs italic text-muted">{p.notes}</p>}
        </div>
      ),
    },
    { key: "amount", label: "Tutar", render: (p) => formatTL(p.amount) },
    {
      key: "due",
      label: "Vade / Ödeme",
      render: (p) => (p.status === "paid" ? `${formatDate(p.due_date)} · Ödeme: ${formatDate(p.paid_at)}` : formatDate(p.due_date)),
    },
    {
      key: "status",
      label: "Durum",
      render: (p) => (
        <span className={`font-bold ${p.status === "paid" ? "text-teal" : "text-yellow"}`}>
          {p.status === "paid" ? "Ödendi" : "Bekliyor"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-3">
          <button onClick={() => handleTogglePaid(p)} className="text-xs font-bold text-teal hover:underline">
            {p.status === "paid" ? "Bekliyor Yap" : "Ödendi İşaretle"}
          </button>
          <button onClick={() => handleDelete(p)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Antrenör Ödemeleri</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAdvanceModalOpen(true)} className="rounded-lg border border-violet px-4 py-2 text-sm font-bold text-violet">
            + Avans Ver
          </button>
          <button onClick={() => setPlanModalOpen(true)} className="rounded-lg bg-violet px-4 py-2 text-sm font-bold text-bg">
            + Ödeme Planı
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-8 rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold text-muted">Bekleyen</p>
          <p className="text-base font-extrabold text-yellow">{formatTL(totals.pending)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted">Ödenen</p>
          <p className="text-base font-extrabold text-teal">{formatTL(totals.paid)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { key: "all", label: "Tümü" },
          { key: "pending", label: "Bekleyen" },
          { key: "paid", label: "Ödendi" },
        ] as { key: StatusFilter; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              statusFilter === f.key ? "border-violet bg-violet text-bg" : "border-line text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} loading={loading} emptyText="Kayıt bulunamadı." />

      {planModalOpen && (
        <CoachPaymentPlanModal
          onClose={() => setPlanModalOpen(false)}
          onSaved={() => {
            setPlanModalOpen(false);
            load();
          }}
        />
      )}

      {advanceModalOpen && (
        <CoachAdvanceModal
          onClose={() => setAdvanceModalOpen(false)}
          onSaved={() => {
            setAdvanceModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
