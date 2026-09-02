import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import { inputClass } from "../../components/FormField";
import { listClubPayments, type Payment } from "../../lib/api/payments";

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

function formatTL(n: number) {
  return `${n.toLocaleString("tr-TR")} ₺`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function FinancialDocumentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    listClubPayments()
      .then((all) => setPayments(all.filter((p) => p.status === "paid")))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = payments;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.athletes?.full_name ?? "").toLowerCase().includes(q));
    if (startDate) list = list.filter((p) => (p.paid_at ?? p.due_date).slice(0, 10) >= startDate);
    if (endDate) list = list.filter((p) => (p.paid_at ?? p.due_date).slice(0, 10) <= endDate);
    return [...list].sort((a, b) => (b.paid_at ?? b.due_date).localeCompare(a.paid_at ?? a.due_date));
  }, [payments, query, startDate, endDate]);

  const totalAmount = useMemo(() => filtered.reduce((sum, p) => sum + Number(p.amount), 0), [filtered]);

  const handleExport = () => {
    if (filtered.length === 0) {
      alert("Seçili filtrelerle eşleşen ödeme bulunamadı.");
      return;
    }
    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Sporcu", "Branş", "Tutar (₺)", "Dönem", "Vade Tarihi", "Ödeme Tarihi"].join(";");
    const rows = filtered.map((p) =>
      [
        p.athletes?.full_name ?? "",
        p.athletes?.groups?.branch ?? "",
        p.amount.toString().replace(".", ","),
        PERIOD_LABEL[p.period] ?? p.period,
        formatDate(p.due_date),
        formatDate(p.paid_at),
      ]
        .map((v) => escapeCsv(String(v)))
        .join(";")
    );
    // Excel'in Türkçe karakterleri doğru göstermesi için UTF-8 BOM ekleniyor.
    const csv = "﻿" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finansal-dokumanlar-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    { key: "due", label: "Vade", render: (p) => formatDate(p.due_date) },
    { key: "paid", label: "Ödeme Tarihi", render: (p) => formatDate(p.paid_at) },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Finansal Dökümanlarım</h1>
        <button onClick={handleExport} className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-bg">
          📥 Excel'e Aktar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input className={`${inputClass} max-w-xs`} placeholder="Sporcu ara…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="text-xs font-semibold text-muted">
          Başlangıç
          <input type="date" className={`${inputClass} mt-1`} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-muted">
          Bitiş
          <input type="date" className={`${inputClass} mt-1`} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="pb-2 text-xs font-bold text-coral"
          >
            Temizle
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
        <span className="text-sm font-semibold text-muted">{filtered.length} ödeme kaydı</span>
        <span className="text-lg font-extrabold text-yellow">{formatTL(totalAmount)}</span>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} loading={loading} emptyText="Eşleşen ödeme kaydı bulunamadı." />
    </div>
  );
}
