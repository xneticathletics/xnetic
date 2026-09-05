import { useEffect, useState } from "react";
import { getPlatformStats, type PlatformStats } from "../../lib/api/superAdmin";

// Mobildeki Ana Sayfa'da (Süper Admin girişinde) satır içinde gösterilen
// platform istatistikleriyle aynı — SuperAdminReportScreen.tsx mobilde
// artık kullanılmıyor (Ana Sayfa'ya taşındı), o yüzden web'de de ayrı bir
// sayfa yerine "Genel Bakış" olarak burada tutuluyor.
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Genel Bakış</h1>
      <p className="mb-6 text-sm text-muted">Platform genelinde tüm kulüplerin özeti.</p>

      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-xs font-bold uppercase text-muted">Toplam Kulüp</div>
            <div className="mt-2 text-3xl font-extrabold text-ink">{stats.totalClubs}</div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-xs font-bold uppercase text-muted">Aktif Abonelik</div>
            <div className="mt-2 text-3xl font-extrabold text-ink">{stats.activeSubscriptions}</div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-xs font-bold uppercase text-muted">Tamamlanan Gelir</div>
            <div className="mt-2 text-3xl font-extrabold text-yellow">₺{stats.completedRevenueTry.toLocaleString("tr-TR")}</div>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs italic text-muted">
        Tamamlanan gelir, sadece gerçekten onaylanmış (status='active') ödemeleri sayar — havale/EFT onayı
        bekleyen ya da test ödemesi (mock_paid) olan kulüpler bu tutara dahil edilmez.
      </p>
    </div>
  );
}
