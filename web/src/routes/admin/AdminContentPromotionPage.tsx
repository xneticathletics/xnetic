import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listClubSpecificContent,
  promoteToGlobal,
  PROMOTABLE_TABLES,
  type ClubContentItem,
  type PromotableTable,
} from "../../lib/api/superAdmin";

export default function AdminContentPromotionPage() {
  const [table, setTable] = useState<PromotableTable>(PROMOTABLE_TABLES[0].table);
  const [items, setItems] = useState<ClubContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listClubSpecificContent(table)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [table]);

  const tableLabel = useMemo(() => PROMOTABLE_TABLES.find((t) => t.table === table)?.label ?? table, [table]);

  const handlePromote = async (item: ClubContentItem) => {
    if (
      !confirm(
        `"${item.name}" artık SADECE "${item.club_name}" kulübüne değil, TÜM kulüplere görünecek. Bu işlem geri alınamaz. Devam edilsin mi?`
      )
    )
      return;
    setPromotingId(item.id);
    try {
      await promoteToGlobal(table, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e: any) {
      alert(e.message ?? "Yükseltilemedi");
    } finally {
      setPromotingId(null);
    }
  };

  const columns: Column<ClubContentItem>[] = [
    { key: "name", label: "İçerik", render: (i) => <span className="font-semibold text-ink">{i.name}</span> },
    { key: "club", label: "Sahibi Kulüp", render: (i) => i.club_name },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (i) => (
        <button
          onClick={() => handlePromote(i)}
          disabled={promotingId === i.id}
          className="rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-bg disabled:opacity-60"
        >
          {promotingId === i.id ? "Yükseltiliyor…" : "🌐 Globale Yükselt"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Kulüp İçeriğini Globale Yükselt</h1>
      <p className="mb-6 text-sm text-muted">
        Bir kulübün eklediği fitness hareketi/besin/tarif/performans testini TÜM kulüplerin gördüğü platform-geneli içeriğe
        çevir. Geri alınamaz.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {PROMOTABLE_TABLES.map((t) => (
          <button
            key={t.table}
            onClick={() => setTable(t.table)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              table === t.table ? "bg-yellow text-bg" : "border border-line text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(i) => i.id}
        loading={loading}
        emptyText={`Şu anda kulübe özel bir "${tableLabel}" kaydı yok.`}
      />
    </div>
  );
}
