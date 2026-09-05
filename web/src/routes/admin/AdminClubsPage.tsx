import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import { listAllClubs, type ClubSummary } from "../../lib/api/superAdmin";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Onay Bekliyor",
  active: "Aktif",
  mock_paid: "Test Ödemesi",
  past_due: "Ödeme Gecikti",
  cancelled: "İptal Edildi",
};
const PERIOD_LABELS: Record<string, string> = { monthly: "Aylık", yearly: "Yıllık" };

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllClubs()
      .then(setClubs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<ClubSummary>[] = [
    { key: "name", label: "Kulüp", render: (c) => <span className="font-semibold text-ink">{c.name}</span> },
    { key: "created_at", label: "Katılım", render: (c) => new Date(c.created_at).toLocaleDateString("tr-TR") },
    {
      key: "subscription",
      label: "Abonelik",
      render: (c) =>
        c.subscription ? (
          <span>
            {PERIOD_LABELS[c.subscription.billing_period] ?? c.subscription.billing_period} ·{" "}
            <span className={c.subscription.status === "pending_review" ? "font-bold text-coral" : ""}>
              {STATUS_LABELS[c.subscription.status] ?? c.subscription.status}
            </span>
          </span>
        ) : (
          <span className="italic text-muted">Abonelik kaydı yok</span>
        ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Kulüpler</h1>
      <p className="mb-6 text-sm text-muted">Platforma kayıtlı tüm kulüpler.</p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={clubs} rowKey={(c) => c.id} loading={loading} emptyText="Henüz kulüp yok." />
    </div>
  );
}
