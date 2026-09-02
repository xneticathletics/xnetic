import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listAllAthletes, type Athlete } from "../lib/api/athletes";
import { listBranches, type Branch } from "../lib/api/branches";
import { listCoaches, type Coach } from "../lib/api/coaches";
import { listSessions, type TrainingSession } from "../lib/api/trainingSessions";
import { listMatches, type MatchRow } from "../lib/api/matches";
import { listAnnouncements, type Announcement } from "../lib/api/announcements";
import { getMonthlyFinanceSummary, type MonthlyFinanceSummary } from "../lib/api/payments";
import { getPendingOrderCount } from "../lib/api/shop";
import { listPendingPasswordResetRequests } from "../lib/api/notifications";
import { getClubName } from "../lib/api/clubSettings";
import { getClubLogoUrl } from "../lib/api/clubLogo";
import { todayKey } from "../lib/date";

function formatTry(n: number) {
  return `${Math.round(n).toLocaleString("tr-TR")} ₺`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

type DayItem =
  | { kind: "session"; time: string; data: TrainingSession }
  | { kind: "match"; time: string; data: MatchRow };

export default function DashboardPage() {
  const { clubId } = useAuth();
  const [clubName, setClubName] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [todayItems, setTodayItems] = useState<DayItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [finance, setFinance] = useState<MonthlyFinanceSummary | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingResets, setPendingResets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClubName().then(setClubName).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      listAllAthletes(),
      listBranches(),
      listCoaches(),
      listSessions(),
      listMatches(),
      listAnnouncements(),
      getMonthlyFinanceSummary(),
      getPendingOrderCount(),
      listPendingPasswordResetRequests(),
    ])
      .then(([a, b, c, sessions, matches, ann, fin, orders, resets]) => {
        setAthletes(a);
        setBranches(b);
        setCoaches(c);
        const today = todayKey();
        const items: DayItem[] = [
          ...sessions
            .filter((s) => s.session_date === today && s.status !== "cancelled")
            .map((s): DayItem => ({ kind: "session", time: s.start_time, data: s })),
          ...matches
            .filter((m) => m.match_date === today)
            .map((m): DayItem => ({ kind: "match", time: m.start_time, data: m })),
        ].sort((x, y) => x.time.localeCompare(y.time));
        setTodayItems(items);
        setAnnouncements(ann.slice(0, 4));
        setFinance(fin);
        setPendingOrders(orders);
        setPendingResets(resets.length);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeAthleteCount = athletes.filter((a) => a.status === "active").length;
  const attentionCount = pendingOrders + pendingResets + (finance ? (finance.overdue > 0 ? 1 : 0) : 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        {clubId && !logoFailed && (
          <img
            src={getClubLogoUrl(clubId)}
            alt="Kulüp logosu"
            onError={() => setLogoFailed(true)}
            className="h-14 w-14 rounded-xl border border-line object-contain"
          />
        )}
        <div>
          <h1 className="text-xl font-bold text-ink">{clubName ?? "Kulüp Özeti"}</h1>
          <p className="text-sm text-muted">{new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="👥" label="Aktif Sporcu" value={loading ? "…" : String(activeAthleteCount)} to="/athletes" />
        <StatCard icon="🏅" label="Branş" value={loading ? "…" : String(branches.length)} to="/branches" />
        <StatCard icon="🧑‍🏫" label="Antrenör" value={loading ? "…" : String(coaches.length)} to="/coaches" />
        <StatCard
          icon="💰"
          label="Bu Ay Beklenen Aidat"
          value={loading || !finance ? "…" : formatTry(finance.expected)}
          to="/finance/overview"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Bugünün Programı" empty={!loading && todayItems.length === 0} emptyText="Bugün için antrenman ya da müsabaka yok.">
            {todayItems.map((item) => (
              <div
                key={`${item.kind}-${item.data.id}`}
                className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-bold text-ink">
                    {item.kind === "match" ? "🏆 " : "📅 "}
                    {item.kind === "match"
                      ? `${item.data.groups?.name ?? "Grup atanmadı"} — vs. ${(item.data as MatchRow).opponent_name}`
                      : (item.data as TrainingSession).groups?.name ?? "Grup atanmadı"}
                  </p>
                  <p className="text-xs text-muted">
                    {item.kind === "session" ? (item.data as TrainingSession).venues?.name ?? "Salon atanmadı" : (item.data as MatchRow).location ?? "Konum belirtilmedi"}
                  </p>
                </div>
                <span className={`text-sm font-bold ${item.kind === "match" ? "text-coral" : "text-teal"}`}>
                  {item.time.slice(0, 5)}
                </span>
              </div>
            ))}
          </SectionCard>

          <div className="mt-6">
            <SectionCard title="Son Duyurular" empty={!loading && announcements.length === 0} emptyText="Henüz duyuru yok.">
              {announcements.map((a) => (
                <div key={a.id} className="border-b border-line px-4 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{a.title}</p>
                    <span className="shrink-0 text-xs text-muted">{formatDate(a.created_at)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{a.body}</p>
                </div>
              ))}
            </SectionCard>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral/20 text-xs font-bold text-coral">
                {loading ? "…" : attentionCount}
              </span>
              <h2 className="text-sm font-bold text-ink">Dikkat Gerektirenler</h2>
            </div>
            <div className="space-y-2">
              <AttentionRow to="/users" label="Bekleyen şifre talebi" count={pendingResets} loading={loading} />
              <AttentionRow to="/shop/orders" label="Bekleyen mağaza siparişi" count={pendingOrders} loading={loading} />
              <AttentionRow
                to="/finance/overview"
                label="Geciken aidat tutarı"
                count={finance && finance.overdue > 0 ? 1 : 0}
                display={finance ? formatTry(finance.overdue) : undefined}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, to }: { icon: string; label: string; value: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-yellow">
      <div className="mb-1 text-xl">{icon}</div>
      <div className="text-lg font-extrabold text-ink">{value}</div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </Link>
  );
}

function SectionCard({
  title,
  empty,
  emptyText,
  children,
}: {
  title: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
      </div>
      {empty ? <p className="px-4 py-6 text-center text-sm text-muted">{emptyText}</p> : children}
    </div>
  );
}

function AttentionRow({
  to,
  label,
  count,
  display,
  loading,
}: {
  to: string;
  label: string;
  count: number;
  display?: string;
  loading: boolean;
}) {
  const active = !loading && count > 0;
  return (
    <Link
      to={to}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
        active ? "bg-coral/10 font-semibold text-ink" : "text-muted hover:bg-bg"
      }`}
    >
      <span>{label}</span>
      <span className={active ? "font-bold text-coral" : ""}>{loading ? "…" : display ?? count}</span>
    </Link>
  );
}
