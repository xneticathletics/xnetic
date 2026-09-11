import { useEffect, useMemo, useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listPlatformTransactions, createPlatformTransaction, deletePlatformTransaction, summarizePlatformTransactions,
  type PlatformTransaction, type PlatformTransactionType,
} from "../../lib/api/platformFinance";

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyForm = { type: "income" as PlatformTransactionType, amount_try: "", description: "", category: "", transaction_date: todayKey() };

export default function AdminFinancePage() {
  const [rows, setRows] = useState<PlatformTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listPlatformTransactions()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const summary = useMemo(() => summarizePlatformTransactions(rows), [rows]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = async () => {
    const amount = Number(form.amount_try);
    if (!form.description.trim() || !amount || amount <= 0) {
      setError("Açıklama ve geçerli bir tutar girmelisin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createPlatformTransaction({
        type: form.type,
        amount_try: amount,
        description: form.description.trim(),
        category: form.category.trim() || null,
        transaction_date: form.transaction_date,
      });
      // Platformun TÜM işlem geçmişini yeniden çekmek yerine (load()), yeni
      // satırı yerinde ekliyoruz.
      setRows((prev) => [created as PlatformTransaction, ...prev]);
      setForm({ ...emptyForm, type: form.type });
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: PlatformTransaction) => {
    if (!confirm(`"${row.description}" kaydını silmek istediğine emin misin?`)) return;
    try {
      await deletePlatformTransaction(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<PlatformTransaction>[] = [
    {
      key: "date",
      label: "Tarih",
      render: (r) => new Date(r.transaction_date).toLocaleDateString("tr-TR"),
    },
    {
      key: "type",
      label: "Tür",
      render: (r) => (
        <span className={`text-xs font-bold ${r.type === "income" ? "text-teal" : "text-coral"}`}>
          {r.type === "income" ? "Gelir" : "Gider"}
        </span>
      ),
    },
    { key: "description", label: "Açıklama", render: (r) => r.description },
    { key: "category", label: "Kategori", render: (r) => r.category ?? "—" },
    {
      key: "amount",
      label: "Tutar",
      className: "text-right",
      render: (r) => (
        <span className={`font-bold ${r.type === "income" ? "text-teal" : "text-coral"}`}>
          {r.type === "income" ? "+" : "-"}₺{Number(r.amount_try).toLocaleString("tr-TR")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (r) => (
        <button onClick={() => handleDelete(r)} className="text-xs font-bold text-coral hover:underline">
          Sil
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Finans</h1>
      <p className="mb-6 text-sm text-muted">X-NETIC'in kendi işletme gelir/gider muhasebesi — kulüplerin finansıyla ilgisi yok.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-xs font-bold uppercase text-muted">Toplam Gelir</div>
          <div className="mt-1 text-2xl font-extrabold text-teal">₺{summary.totalIncome.toLocaleString("tr-TR")}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-xs font-bold uppercase text-muted">Toplam Gider</div>
          <div className="mt-1 text-2xl font-extrabold text-coral">₺{summary.totalExpense.toLocaleString("tr-TR")}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-xs font-bold uppercase text-muted">Net</div>
          <div className={`mt-1 text-2xl font-extrabold ${summary.net >= 0 ? "text-ink" : "text-coral"}`}>
            ₺{summary.net.toLocaleString("tr-TR")}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">Yeni Kayıt Ekle</h2>
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => set("type", "income")}
            aria-pressed={form.type === "income"}
            className={`flex-1 rounded-lg border py-2 text-sm font-bold ${form.type === "income" ? "border-teal bg-teal text-bg" : "border-line text-muted"}`}
          >
            Gelir
          </button>
          <button
            onClick={() => set("type", "expense")}
            aria-pressed={form.type === "expense"}
            className={`flex-1 rounded-lg border py-2 text-sm font-bold ${form.type === "expense" ? "border-coral bg-coral text-bg" : "border-line text-muted"}`}
          >
            Gider
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Açıklama *">
            <input className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Örn. Aylık abonelik geliri" />
          </FormField>
          <FormField label="Tutar (₺) *">
            <input type="number" className={inputClass} value={form.amount_try} onChange={(e) => set("amount_try", e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Kategori">
            <input className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Örn. Barındırma, Reklam" />
          </FormField>
          <FormField label="Tarih">
            <input type="date" className={inputClass} value={form.transaction_date} onChange={(e) => set("transaction_date", e.target.value)} />
          </FormField>
        </div>

        {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

        <button
          onClick={handleAdd}
          disabled={saving}
          className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {saving ? "Kaydediliyor…" : "Ekle"}
        </button>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} emptyText="Henüz kayıt yok." />
    </div>
  );
}
