import { useEffect, useMemo, useState } from "react";
import { inputClass } from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { listClubPayments, type Payment } from "../../lib/api/payments";
import { listExpenses, deleteExpense, type Expense } from "../../lib/api/expenses";
import { listExtraIncome, deleteExtraIncome, type ExtraIncome } from "../../lib/api/extraIncome";
import { listCoachPayments, type CoachPayment } from "../../lib/api/coachPayments";
import { getFinancePeriodRange } from "../../lib/api/financeSummary";
import { getClubSettings } from "../../lib/api/clubSettings";

const PERIOD_LABEL: Record<string, string> = { weekly: "Haftalık", monthly: "Aylık", yearly: "Yıllık" };

type DocItem =
  | { kind: "income"; date: string; data: Payment }
  | { kind: "extraIncome"; date: string; data: ExtraIncome }
  | { kind: "expense"; date: string; data: Expense }
  | { kind: "coachPayment"; date: string; data: CoachPayment };

function formatTL(n: number) {
  return `${n.toLocaleString("tr-TR")} ₺`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function FinancialDocumentsPage() {
  const { clubId } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [extraIncome, setExtraIncome] = useState<ExtraIncome[]>([]);
  const [coachPayments, setCoachPayments] = useState<CoachPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [defaultRangeSet, setDefaultRangeSet] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const [allPayments, allExpenses, allExtraIncome, allCoachPayments] = await Promise.all([
        listClubPayments(),
        listExpenses(),
        listExtraIncome(),
        listCoachPayments(),
      ]);
      setPayments(allPayments.filter((p) => p.status === "paid"));
      setExpenses(allExpenses);
      setExtraIncome(allExtraIncome);
      setCoachPayments(allCoachPayments.filter((c) => c.status === "paid"));
    } catch (e: any) {
      setError(e.message ?? "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Varsayılan tarih aralığı: "finans dönemi" başlangıç gününden bugüne —
  // sadece BİR KEZ (ilk açılışta) uygulanır, kullanıcı isterse geriye
  // dönük olarak serbestçe değiştirebilir.
  useEffect(() => {
    if (defaultRangeSet || !clubId) return;
    getClubSettings(clubId)
      .then((settings) => {
        const range = getFinancePeriodRange(settings.finance_period_start_day);
        setStartDate(range.start);
        setEndDate(range.end);
      })
      .finally(() => setDefaultRangeSet(true));
  }, [defaultRangeSet, clubId]);

  const items = useMemo<DocItem[]>(() => {
    const income: DocItem[] = payments.map((p) => ({ kind: "income", date: (p.paid_at ?? p.due_date).slice(0, 10), data: p }));
    const extra: DocItem[] = extraIncome.map((e) => ({ kind: "extraIncome", date: e.income_date, data: e }));
    const expense: DocItem[] = expenses.map((e) => ({ kind: "expense", date: e.expense_date, data: e }));
    const coachPay: DocItem[] = coachPayments.map((c) => ({ kind: "coachPayment", date: (c.paid_at ?? c.due_date).slice(0, 10), data: c }));
    return [...income, ...extra, ...expense, ...coachPay];
  }, [payments, extraIncome, expenses, coachPayments]);

  const filtered = useMemo(() => {
    let list = items;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        if (item.kind === "income") return (item.data.athletes?.full_name ?? "").toLowerCase().includes(q);
        if (item.kind === "coachPayment") {
          const coachName = item.data.users?.name ?? "";
          return coachName.toLowerCase().includes(q) || (item.data.notes ?? "").toLowerCase().includes(q);
        }
        return item.data.description.toLowerCase().includes(q);
      });
    }
    if (startDate) list = list.filter((item) => item.date >= startDate);
    if (endDate) list = list.filter((item) => item.date <= endDate);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [items, query, startDate, endDate]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((item) => {
      if (item.kind === "expense" || item.kind === "coachPayment") expense += Number(item.data.amount);
      else income += Number(item.data.amount);
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleDeleteExpense = async (item: Expense) => {
    if (!confirm(`"${item.description}" (${formatTL(item.amount)}) gider kaydını silmek istediğine emin misin?`)) return;
    try {
      await deleteExpense(item.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const handleDeleteExtraIncome = async (item: ExtraIncome) => {
    if (!confirm(`"${item.description}" (${formatTL(item.amount)}) gelir kaydını silmek istediğine emin misin?`)) return;
    try {
      await deleteExtraIncome(item.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      alert("Seçili filtrelerle eşleşen kayıt bulunamadı.");
      return;
    }
    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Tür", "Açıklama", "Branş", "Tutar (₺)", "Tarih"].join(";");
    const rows = filtered.map((item) => {
      const isAidat = item.kind === "income";
      const description = isAidat
        ? `${item.data.athletes?.full_name ?? "—"} — ${PERIOD_LABEL[item.data.period] ?? item.data.period} Aidat`
        : item.kind === "coachPayment"
        ? `${item.data.users?.name ?? "—"} — Antrenör Ödemesi${item.data.notes ? ` (${item.data.notes})` : ""}`
        : item.data.description;
      const branch = isAidat ? item.data.athletes?.groups?.branch ?? "" : "";
      const typeLabel = item.kind === "expense" || item.kind === "coachPayment" ? "Gider" : "Gelir";
      return [typeLabel, description, branch, item.data.amount.toString().replace(".", ","), formatDate(item.date)]
        .map((v) => escapeCsv(String(v)))
        .join(";");
    });
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Finansal Dökümanlarım</h1>
        <button onClick={handleExport} className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-bg">
          📥 Excel'e Aktar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Sporcu, antrenör, gelir ya da gider açıklaması ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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

      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold text-muted">Gelir</p>
          <p className="text-base font-extrabold text-teal">{formatTL(totals.income)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted">Gider</p>
          <p className="text-base font-extrabold text-coral">{formatTL(totals.expense)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted">Toplam</p>
          <p className="text-base font-extrabold text-yellow">{formatTL(totals.net)}</p>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="px-4 py-3 text-left font-semibold text-muted">Tür</th>
              <th className="px-4 py-3 text-left font-semibold text-muted">Açıklama</th>
              <th className="px-4 py-3 text-left font-semibold text-muted">Tarih</th>
              <th className="px-4 py-3 text-right font-semibold text-muted">Tutar</th>
              <th className="px-4 py-3 text-right font-semibold text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Eşleşen kayıt bulunamadı.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((item) => {
                if (item.kind === "coachPayment") {
                  const c = item.data;
                  return (
                    <tr key={`coachPayment-${c.id}`} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3 text-coral font-semibold">Gider</td>
                      <td className="px-4 py-3 text-ink">
                        <span className="font-semibold">{c.users?.name ?? "Antrenör"}</span>
                        <span className="ml-1 text-xs text-muted">· Antrenör Ödemesi</span>
                      </td>
                      <td className="px-4 py-3 text-ink">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 text-right font-bold text-coral">-{formatTL(c.amount)}</td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  );
                }
                if (item.kind === "expense") {
                  const e = item.data;
                  return (
                    <tr key={`expense-${e.id}`} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3 text-coral font-semibold">Gider</td>
                      <td className="px-4 py-3 text-ink font-semibold">{e.description}</td>
                      <td className="px-4 py-3 text-ink">{formatDate(e.expense_date)}</td>
                      <td className="px-4 py-3 text-right font-bold text-coral">-{formatTL(e.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteExpense(e)} className="text-xs font-bold text-coral hover:underline">
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                }
                if (item.kind === "extraIncome") {
                  const e = item.data;
                  return (
                    <tr key={`extraIncome-${e.id}`} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3 text-teal font-semibold">Gelir</td>
                      <td className="px-4 py-3 text-ink font-semibold">{e.description}</td>
                      <td className="px-4 py-3 text-ink">{formatDate(e.income_date)}</td>
                      <td className="px-4 py-3 text-right font-bold text-teal">+{formatTL(e.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteExtraIncome(e)} className="text-xs font-bold text-coral hover:underline">
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                }
                const p = item.data;
                return (
                  <tr key={`income-${p.id}`} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3 text-teal font-semibold">Gelir</td>
                    <td className="px-4 py-3 text-ink">
                      <span className="font-semibold">{p.athletes?.full_name ?? "—"}</span>
                      {p.athletes?.groups?.branch && <span className="ml-1 text-xs text-muted">· {p.athletes.groups.branch}</span>}
                      <span className="ml-1 text-xs text-muted">· {PERIOD_LABEL[p.period]} Aidat</span>
                    </td>
                    <td className="px-4 py-3 text-ink">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal">+{formatTL(p.amount)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
