import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPlatformStats, listAllSubscriptions, listAllClubs, type PlatformStats, type SubscriptionRow, type ClubSummary } from "../../lib/api/superAdmin";

const STATUS_META: { key: string; label: string; barClass: string; textClass: string }[] = [
  { key: "pending_review", label: "Onay Bekliyor", barClass: "bg-coral", textClass: "text-coral" },
  { key: "active", label: "Aktif", barClass: "bg-teal", textClass: "text-teal" },
  { key: "mock_paid", label: "Test Ödemesi", barClass: "bg-violet", textClass: "text-violet" },
  { key: "past_due", label: "Ödeme Gecikti", barClass: "bg-coral", textClass: "text-coral" },
  { key: "cancelled", label: "İptal Edildi", barClass: "bg-muted", textClass: "text-muted" },
  { key: "none", label: "Abonelik Yok", barClass: "bg-muted", textClass: "text-muted" },
];

const CLUB_STATUS_LABELS: Record<string, string> = {
  pending_review: "Onay Bekliyor",
  active: "Aktif",
  mock_paid: "Test Ödemesi",
  past_due: "Ödeme Gecikti",
  cancelled: "İptal Edildi",
};

function StatCard({ icon, label, value, accentClass }: { icon: string; label: string; value: string; accentClass: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 border-l-4 ${accentClass}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      </div>
      <div className="text-3xl font-extrabold text-ink">{value}</div>
    </div>
  );
}

// Mobildeki Ana Sayfa'da (Süper Admin girişinde) satır içinde gösterilen
// platform istatistikleriyle aynı veri — SuperAdminReportScreen.tsx mobilde
// artık kullanılmıyor (Ana Sayfa'ya taşındı), o yüzden web'de de ayrı bir
// sayfa yerine "Genel Bakış" olarak burada tutuluyor. Web'e özel olarak
// ayrıca abonelik durum dağılımı ve son katılan kulüpler eklendi.
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPlatformStats(), listAllSubscriptions(), listAllClubs()])
      .then(([s, subs, c]) => {
        setStats(s);
        setSubscriptions(subs);
        setClubs(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = useMemo(() => subscriptions.filter((s) => s.status === "pending_review").length, [subscriptions]);

  const statusCounts = useMemo(() => {
    const counts = STATUS_META.map((m) => ({ ...m, count: subscriptions.filter((s) => s.status === m.key).length }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return counts.filter((c) => c.count > 0).map((c) => ({ ...c, pct: Math.round((c.count / max) * 100) }));
  }, [subscriptions]);

  const recentClubs = clubs.slice(0, 6);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Genel Bakış</h1>
      <p className="mb-6 text-sm text-muted">Platform genelinde tüm kulüplerin özeti.</p>

      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="🏢" label="Toplam Kulüp" value={String(stats.totalClubs)} accentClass="border-l-yellow" />
            <Link to="/admin/subscriptions" className="block">
              <StatCard icon="⏳" label="Onay Bekliyor" value={String(pendingCount)} accentClass="border-l-coral" />
            </Link>
            <StatCard icon="✅" label="Aktif Abonelik" value={String(stats.activeSubscriptions)} accentClass="border-l-teal" />
            <StatCard icon="💰" label="Tamamlanan Gelir" value={`₺${stats.completedRevenueTry.toLocaleString("tr-TR")}`} accentClass="border-l-yellow" />
          </div>
          <p className="mt-3 text-xs italic text-muted">
            Tamamlanan gelir, sadece gerçekten onaylanmış (status='active') ödemeleri sayar — havale/EFT onayı
            bekleyen ya da test ödemesi (mock_paid) olan kulüpler bu tutara dahil edilmez.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-4 text-sm font-bold text-ink">Abonelik Durumu Dağılımı</h2>
              {statusCounts.length === 0 && <p className="text-sm text-muted">Henüz veri yok.</p>}
              <div className="space-y-3">
                {statusCounts.map((s) => (
                  <div key={s.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${s.textClass}`}>{s.label}</span>
                      <span className="font-bold text-ink">{s.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                      <div className={`h-full rounded-full ${s.barClass}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">Son Katılan Kulüpler</h2>
                <Link to="/admin/clubs" className="text-xs font-bold text-teal hover:underline">
                  Tümünü Gör
                </Link>
              </div>
              <div className="space-y-2">
                {recentClubs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-line bg-bg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-semibold text-ink">{c.name}</div>
                      <div className="text-xs text-muted">{new Date(c.created_at).toLocaleDateString("tr-TR")}</div>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        c.subscription?.status === "pending_review" ? "text-coral" : c.subscription?.status === "active" ? "text-teal" : "text-muted"
                      }`}
                    >
                      {c.subscription ? CLUB_STATUS_LABELS[c.subscription.status] ?? c.subscription.status : "—"}
                    </span>
                  </div>
                ))}
                {recentClubs.length === 0 && <p className="text-sm text-muted">Henüz kulüp yok.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
