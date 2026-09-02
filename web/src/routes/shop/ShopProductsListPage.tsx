import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listAllProducts,
  updateProduct,
  deleteProduct,
  type ShopProductAdmin,
  type ShopGender,
} from "../../lib/api/shop";
import ShopProductModal from "./ShopProductModal";

const GENDER_LABEL: Record<ShopGender, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex" };

export default function ShopProductsListPage() {
  const [products, setProducts] = useState<ShopProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopProductAdmin | "new" | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listAllProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleActive = async (p: ShopProductAdmin) => {
    try {
      await updateProduct(p.id, { is_active: !p.is_active });
      load();
    } catch (e: any) {
      alert(e.message ?? "İşlem başarısız");
    }
  };

  const handleDelete = async (p: ShopProductAdmin) => {
    if (!confirm(`"${p.title}" kalıcı olarak silinecek. Emin misin?`)) return;
    try {
      await deleteProduct(p.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

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
    { key: "price", label: "Fiyat", render: (p) => `${Number(p.price).toLocaleString("tr-TR")} ₺` },
    { key: "category", label: "Kategori", render: (p) => p.category ?? "—" },
    { key: "gender", label: "Cinsiyet", render: (p) => (p.gender ? GENDER_LABEL[p.gender] : "—") },
    {
      key: "stock",
      label: "Stok",
      render: (p) => (
        <span className={`font-semibold ${p.totalStock > 0 ? "text-violet" : "text-coral"}`}>{p.totalStock}</span>
      ),
    },
    {
      key: "status",
      label: "Durum",
      render: (p) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            p.is_active ? "bg-teal/15 text-teal" : "bg-muted/15 text-muted"
          }`}
        >
          {p.is_active ? "Aktif" : "Pasif"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(p)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleToggleActive(p)} className="text-xs font-bold text-violet hover:underline">
            {p.is_active ? "Pasifleştir" : "Aktifleştir"}
          </button>
          <button onClick={() => handleDelete(p)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Mağaza — Ürünler</h1>
        <div className="flex gap-2">
          <Link to="/shop/orders" className="rounded-lg border border-violet px-4 py-2 text-sm font-bold text-violet">
            📦 Siparişler
          </Link>
          <Link to="/shop/stock" className="rounded-lg border border-teal px-4 py-2 text-sm font-bold text-teal">
            📊 Stok
          </Link>
          <button onClick={() => setEditing("new")} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            + Ürün Ekle
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={products} rowKey={(p) => p.id} loading={loading} emptyText="Henüz ürün eklenmedi." />

      {editing && (
        <ShopProductModal
          product={editing === "new" ? null : editing}
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
