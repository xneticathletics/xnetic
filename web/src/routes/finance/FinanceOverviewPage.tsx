import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { inputClass } from "../../components/FormField";
import {
  listClubPayments,
  markPaymentPaid,
  isOverdue,
  getMonthlyFinanceSummary,
  type Payment,
  type MonthlyFinanceSummary,
} from "../../lib/api/payments";
import { topUpAllActivePlans } from "../../lib/api/paymentPlans";
import { getClubSettings } from "../../lib/api/clubSettings";
import PaymentPlanModal from "./PaymentPlanModal";

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

type StatusFilter = "all" | "pending" | "overdue" | "paid";

function formatTL(n: number) {
  return `${n.toLocaleString("tr-TR")} ₺`;
}

export default function FinanceOverviewPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<MonthlyFinanceSummary | null>(null);
  const [graceDays, setGraceDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const settings = await getClubSettings();
      setGraceDays(settings.payment_overdue_grace_days);
      await topUpAllActivePlans();
      const [all, s] = await Promise.all([listClubPayments(), getMonthlyFinanceSummary(settings.payment_overdue_grace_days)]);
      setPayments(all);
      setSummary(s);
    } catch (e: any) {
      setError(e.message ?? "Ödemeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = payments;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.athletes?.full_name ?? "").toLowerCase().includes(q));
    if (statusFilter === "paid") list = list.filter((p) => p.status === "paid");
    else if (statusFilter === "overdue") list = list.filter((p) => isOverdue(p, graceDays));
    else if (statusFilter === "pending") list = list.filter((p) => p.status === "pending" && !isOverdue(p, graceDays));
    return list;
  }, [payments, query, statusFilter, graceDays]);

  const handleMarkPaid = async (p: Payment) => {
    if (!confirm(`${p.athletes?.full_name ?? "Bu sporcu"} için ${formatTL(p.amount)} tutarındaki aidatı ödendi olarak işaretlemek istediğine emin misin?`))
      return;
    try {
      await markPaymentPaid(p.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "İşaretlenemedi");
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: "athlete",
      label: "Sporcu",
      render: (p) => (
        <div>
          <span className="font-semibold">{p.athletes?.full_name ?? "—"}</span>
          {p.athletes?.groups?.branch && <span className="ml-1 text-xs text-muted">· {p.athletes.groups.branch}</span>}
        </div>
      ),
    },
    { key: "period", label: "Dönem", render: (p) => PERIOD_LABEL[p.period] },
    { key: "amount", label: "Tutar", render: (p) => formatTL(p.amount) },
    { key: "due", label: "Vade", render: (p) => p.due_date },
    {
      key: "status",
      label: "Durum",
      render: (p) => {
        const overdue = isOverdue(p, graceDays);
        const label = p.status === "paid" ? "Ödendi" : overdue ? "Gecikmiş" : "Bekliyor";
        const color = p.status === "paid" ? "text-teal" : overdue ? "text-coral" : "text-muted";
        return <span className={`font-bold ${color}`}>{label}</span>;
      },
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (p) =>
        p.status !== "paid" ? (
          <button onClick={() => handleMarkPaid(p)} className="text-xs font-bold text-teal hover:underline">
            Ödendi İşaretle
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Finans — Genel Bakış</h1>
        <div className="flex gap-2">
          <Link
            to="/finance/documents"
            className="rounded-lg border border-teal px-4 py-2 text-sm font-bold text-teal"
          >
            📄 Finansal Dökümanlarım
          </Link>
          <button onClick={() => setPlanModalOpen(true)} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            + Aidat Planı
          </button>
        </div>
      </div>

      {summary && (
        <div className="mb-6 rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Bu Ay Beklenen Toplam Aidat</p>
          <p className="mb-3 mt-1 text-2xl font-extrabold text-yellow">{formatTL(summary.expected)}</p>
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-semibold text-muted">Tahsil Edilen</p>
              <p className="font-bold text-teal">{formatTL(summary.collected)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Bekleyen</p>
              <p className="font-bold text-yellow">{formatTL(summary.pending)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Vadesi Geçmiş</p>
              <p className="font-bold text-coral">{formatTL(summary.overdue)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Sporcu ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={`${inputClass} max-w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">Tümü</option>
          <option value="pending">Bekleyen</option>
          <option value="overdue">Vadesi Geçmiş</option>
          <option value="paid">Ödendi</option>
        </select>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} loading={loading} emptyText="Eşleşen aidat kaydı yok." />

      {planModalOpen && (
        <PaymentPlanModal
          onClose={() => setPlanModalOpen(false)}
          onSaved={() => {
            setPlanModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
