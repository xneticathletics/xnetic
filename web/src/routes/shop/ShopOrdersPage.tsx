import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import { listAllOrders, updateOrderStatus, variantLabel, type ShopOrder, type ShopOrderStatus } from "../../lib/api/shop";

const STATUS_LABEL: Record<ShopOrderStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};
const STATUS_CLASS: Record<ShopOrderStatus, string> = {
  pending: "bg-yellow/15 text-yellow",
  confirmed: "bg-teal/15 text-teal",
  delivered: "bg-teal/15 text-teal",
  cancelled: "bg-coral/15 text-coral",
};
const PAYMENT_LABEL: Record<string, string> = { havale: "Havale/EFT", elden: "Elden" };

type Filter = "all" | ShopOrderStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Bekliyor" },
  { key: "confirmed", label: "Onaylandı" },
  { key: "delivered", label: "Teslim Edildi" },
  { key: "cancelled", label: "İptal" },
];

// Bir siparişe verilebilecek yeni durumlar — mevcut durum listeden çıkarılır
// (mobildeki ShopOrdersScreen'deki seçenek mantığıyla aynı).
const NEXT_STATUS_OPTIONS: { key: ShopOrderStatus; label: string }[] = [
  { key: "confirmed", label: "Onayla" },
  { key: "delivered", label: "Teslim Edildi" },
  { key: "cancelled", label: "İptal Et" },
];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listAllOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => (filter === "all" ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);

  const handleStatusChange = async (order: ShopOrder, status: ShopOrderStatus) => {
    if (status === order.status) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      load();
    } catch (e: any) {
      alert(e.message ?? "Güncellenemedi");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<ShopOrder>[] = [
    {
      key: "product",
      label: "Ürün",
      render: (o) => (
        <div>
          <span className="font-semibold">{o.shop_products?.title ?? "Ürün"}</span>
          {variantLabel(o.shop_product_variants) && (
            <span className="ml-1 text-xs text-muted">· {variantLabel(o.shop_product_variants)}</span>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      label: "Veli",
      render: (o) => (
        <div>
          <div>{o.users?.name ?? "—"}</div>
          {o.users?.phone && <div className="text-xs text-muted">{o.users.phone}</div>}
        </div>
      ),
    },
    { key: "quantity", label: "Adet", render: (o) => o.quantity },
    { key: "payment", label: "Ödeme", render: (o) => PAYMENT_LABEL[o.payment_method] ?? o.payment_method },
    { key: "total", label: "Tutar", render: (o) => `${Number(o.total_price).toLocaleString("tr-TR")} ₺` },
    { key: "date", label: "Tarih", render: (o) => new Date(o.created_at).toLocaleDateString("tr-TR") },
    { key: "note", label: "Not", render: (o) => (o.note ? <span className="text-xs italic text-muted">{o.note}</span> : "—") },
    {
      key: "status",
      label: "Durum",
      render: (o) => (
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
          <select
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs disabled:opacity-50"
            value=""
            disabled={updatingId === o.id}
            onChange={(e) => {
              const value = e.target.value as ShopOrderStatus;
              if (value) handleStatusChange(o, value);
              e.target.value = "";
            }}
          >
            <option value="">Durum değiştir…</option>
            {NEXT_STATUS_OPTIONS.filter((opt) => opt.key !== o.status).map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink">Mağaza — Siparişler</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === f.key ? "border-violet bg-violet text-bg" : "border-line text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={filtered} rowKey={(o) => o.id} loading={loading} emptyText="Sipariş bulunamadı." />
    </div>
  );
}
