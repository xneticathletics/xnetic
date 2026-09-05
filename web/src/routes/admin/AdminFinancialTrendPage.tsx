import { useEffect, useMemo, useState } from "react";
import { getFinancialTrend, type FinancialTrendMonth } from "../../lib/api/superAdmin";

const MONTH_LABELS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

export default function AdminFinancialTrendPage() {
  const [months, setMonths] = useState<FinancialTrendMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFinancialTrend()
      .then(setMonths)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = useMemo(() => Math.max(1, ...months.map((m) => m.revenueTry)), [months]);
  const totalRevenue = useMemo(() => months.reduce((s, m) => s + m.revenueTry, 0), [months]);
  const totalNewClubs = useMemo(() => months.reduce((s, m) => s + m.newClubs, 0), [months]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Finansal Trend Raporu</h1>
      <p className="mb-6 text-sm text-muted">
        Son 12 ay — onaylanan abonelik ödemeleri ve yeni kulüp katılımları. Geçmiş veri, abonelik geçmişi takibinin başladığı
        andan itibaren birikir; eski aylar bu yüzden boş görünebilir.
      </p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-bold uppercase text-muted">Toplam Gelir (12 Ay)</div>
              <div className="mt-1 text-2xl font-extrabold text-ink">₺{totalRevenue.toLocaleString("tr-TR")}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-bold uppercase text-muted">Yeni Kulüp (12 Ay)</div>
              <div className="mt-1 text-2xl font-extrabold text-ink">{totalNewClubs}</div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-end gap-2" style={{ height: 220 }}>
              {months.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="text-[10px] font-bold text-ink">
                    {m.revenueTry > 0 ? `₺${Math.round(m.revenueTry / 1000)}k` : ""}
                  </div>
                  <div
                    className="w-full rounded-t-md bg-yellow"
                    style={{ height: `${Math.max(2, (m.revenueTry / maxRevenue) * 160)}px` }}
                    title={`₺${m.revenueTry.toLocaleString("tr-TR")}`}
                  />
                  <div className="text-[10px] font-semibold text-muted">{formatMonth(m.month)}</div>
                  {m.newClubs > 0 && <div className="text-[10px] font-bold text-teal">+{m.newClubs} kulüp</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
