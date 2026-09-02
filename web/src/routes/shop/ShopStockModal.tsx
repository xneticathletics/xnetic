import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import { listProductVariantsAdmin, updateVariantStock, type ShopProductAdmin, type ShopVariantAdmin } from "../../lib/api/shop";

export default function ShopStockModal({
  product,
  onClose,
  onSaved,
}: {
  product: ShopProductAdmin;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [variants, setVariants] = useState<ShopVariantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    listProductVariantsAdmin(product.id)
      .then(setVariants)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [product.id]);

  const adjust = async (variant: ShopVariantAdmin, delta: number) => {
    const newStock = Math.max(0, variant.stock + delta);
    setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, stock: newStock } : v)));
    setSavingId(variant.id);
    try {
      await updateVariantStock(variant.id, newStock);
      setDirty(true);
    } catch (e: any) {
      alert(e.message ?? "Güncellenemedi");
      setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, stock: variant.stock } : v)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Modal title={`${product.title} — Stok`} onClose={() => (dirty ? onSaved() : onClose())}>
      {loading && <p className="py-6 text-center text-sm text-muted">Yükleniyor…</p>}
      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}
      {!loading && (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {variants.length === 0 && <p className="text-sm text-muted">Bu ürünün varyantı yok.</p>}
          {variants.map((v) => {
            const label = [v.color, v.size].filter(Boolean).join(" / ") || "Genel";
            return (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-line bg-bg p-3">
                <span className="text-sm font-semibold text-ink">{label}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjust(v, -1)}
                    disabled={savingId === v.id}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-base font-bold text-ink disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-ink">{v.stock}</span>
                  <button
                    type="button"
                    onClick={() => adjust(v, 1)}
                    disabled={savingId === v.id}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-base font-bold text-ink disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
