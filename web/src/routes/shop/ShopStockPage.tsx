import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import { listAllProducts, type ShopProductAdmin } from "../../lib/api/shop";
import ShopStockModal from "./ShopStockModal";

export default function ShopStockPage() {
  const [products, setProducts] = useState<ShopProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopProductAdmin | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listAllProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: Column<ShopProductAdmin>[] = [
    {
      key: "photo",
      label: "",
      className: "w-16",
      render: (p) =>
        p.photo_urls[0] ? (
          <img src={p.photo_urls[0]} alt={p.title} className="h-10 w-10 rounded-lg border border-line object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-bg text-lg">🛍️</div>
        ),
    },
    { key: "title", label: "Ürün", render: (p) => <span className="font-semibold">{p.title}</span> },
    {
      key: "stock",
      label: "Toplam Stok",
      render: (p) => (
        <span className={`font-semibold ${p.totalStock > 0 ? "text-violet" : "text-coral"}`}>{p.totalStock}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (p) => (
        <button onClick={() => setEditing(p)} className="text-xs font-bold text-teal hover:underline">
          Stoğu Düzenle
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink">Mağaza — Stok</h1>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={products} rowKey={(p) => p.id} loading={loading} emptyText="Henüz ürün eklenmedi." />

      {editing && (
        <ShopStockModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
