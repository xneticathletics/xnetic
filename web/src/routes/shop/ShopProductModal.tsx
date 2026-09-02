import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  createProduct,
  updateProduct,
  addProductPhoto,
  removeProductPhoto,
  listProductVariantsAdmin,
  saveProductVariants,
  type ShopProductAdmin,
  type ShopGender,
  type VariantCombo,
} from "../../lib/api/shop";

const CATEGORY_OPTIONS = ["Forma", "Şort", "Eşofman", "Ayakkabı", "Çanta", "Aksesuar", "Diğer"];
const GENDER_OPTIONS: { value: ShopGender; label: string }[] = [
  { value: "kadin", label: "Kadın" },
  { value: "erkek", label: "Erkek" },
  { value: "unisex", label: "Unisex" },
];

function comboKey(color: string | null, size: string | null) {
  return `${color ?? ""}|${size ?? ""}`;
}

function computeCombos(colors: string[], sizes: string[]): { color: string | null; size: string | null }[] {
  if (colors.length === 0 && sizes.length === 0) return [{ color: null, size: null }];
  if (colors.length === 0) return sizes.map((s) => ({ color: null, size: s }));
  if (sizes.length === 0) return colors.map((c) => ({ color: c, size: null }));
  return colors.flatMap((c) => sizes.map((s) => ({ color: c, size: s })));
}

// Yeni ürün oluşturulurken fotoğraflar henüz bir productId'ye bağlı
// olmadığından, seçilen dosyaları ve önizleme URL'lerini bellekte tutup
// ürün kaydedildikten sonra sırayla yüklüyoruz (mobildeki localPhotos
// mantığının web karşılığı).
type LocalPhoto = { file: File; previewUrl: string };

export default function ShopProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: ShopProductAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !product;

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState<string | null>(product?.category ?? null);
  const [gender, setGender] = useState<ShopGender | null>(product?.gender ?? null);
  const isShoeCategory = category === "Ayakkabı";

  const [photos, setPhotos] = useState<string[]>(product?.photo_urls ?? []);
  const [localPhotos, setLocalPhotos] = useState<LocalPhoto[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [variantStocks, setVariantStocks] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !product) return;
    listProductVariantsAdmin(product.id)
      .then((variants) => {
        setColorOptions([...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))]);
        setSizes([...new Set(variants.map((v) => v.size).filter((s): s is string => !!s))]);
        setVariantStocks(Object.fromEntries(variants.map((v) => [comboKey(v.color, v.size), String(v.stock)])));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, isNew]);

  const combos = useMemo(() => computeCombos(colorOptions, sizes), [colorOptions, sizes]);

  useEffect(() => {
    setVariantStocks((prev) => {
      const next: Record<string, string> = {};
      for (const c of combos) {
        const k = comboKey(c.color, c.size);
        next[k] = prev[k] ?? "0";
      }
      return next;
    });
  }, [combos]);

  const addColor = () => {
    const v = colorInput.trim();
    if (!v || colorOptions.includes(v)) return;
    setColorOptions((prev) => [...prev, v]);
    setColorInput("");
  };
  const addSize = () => {
    const v = sizeInput.trim();
    if (!v || sizes.includes(v)) return;
    setSizes((prev) => [...prev, v]);
    setSizeInput("");
  };

  const displayPhotoUrls = isNew ? localPhotos.map((p) => p.previewUrl) : photos;
  const photoCount = isNew ? localPhotos.length : photos.length;

  const handlePickPhoto = async (file: File) => {
    if (photoCount >= 5) return;
    if (isNew) {
      setLocalPhotos((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
      return;
    }
    setUploadingPhoto(true);
    try {
      const newUrls = await addProductPhoto(product!.id, file, photos);
      setPhotos(newUrls);
    } catch (e: any) {
      alert(e.message ?? "Fotoğraf yüklenemedi");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (url: string) => {
    if (isNew) {
      setLocalPhotos((prev) => prev.filter((p) => p.previewUrl !== url));
      return;
    }
    try {
      const newUrls = await removeProductPhoto(product!.id, url, photos);
      setPhotos(newUrls);
    } catch (e: any) {
      alert(e.message ?? "Fotoğraf kaldırılamadı");
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const parsedPrice = parseFloat(price.replace(",", "."));
    if (!trimmedTitle) return setError("Başlık zorunludur.");
    if (isNaN(parsedPrice) || parsedPrice < 0) return setError("Geçerli bir fiyat gir.");

    const variantCombos: VariantCombo[] = [];
    for (const c of combos) {
      const raw = variantStocks[comboKey(c.color, c.size)] ?? "0";
      const parsedStock = parseInt(raw, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return setError("Tüm seçenekler için geçerli bir stok adedi gir.");
      }
      variantCombos.push({ color: c.color, size: c.size, stock: parsedStock });
    }

    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const created = await createProduct({
          title: trimmedTitle,
          description: description.trim() || null,
          price: parsedPrice,
          category,
          gender,
        });
        let uploaded: string[] = [];
        for (const p of localPhotos) {
          uploaded = await addProductPhoto(created.id, p.file, uploaded);
        }
        await saveProductVariants(created.id, variantCombos);
      } else {
        await updateProduct(product!.id, {
          title: trimmedTitle,
          description: description.trim() || null,
          price: parsedPrice,
          category,
          gender,
        });
        await saveProductVariants(product!.id, variantCombos);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isNew ? "Yeni Ürün" : `${product!.title} — Düzenle`} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Yükleniyor…</p>
        ) : (
          <>
            <FormField label={`Fotoğraflar (${photoCount}/5)`}>
              <div className="flex flex-wrap gap-2">
                {displayPhotoUrls.map((url) => (
                  <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-line bg-bg">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {photoCount < 5 && (
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line bg-bg text-center text-xs font-semibold text-muted">
                    {uploadingPhoto ? "…" : "+ Ekle"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePickPhoto(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </FormField>

            <FormField label="Başlık *">
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ürün başlığı" />
            </FormField>

            <FormField label="Açıklama">
              <textarea
                className={`${inputClass} h-20`}
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürün açıklaması"
              />
            </FormField>

            <FormField label="Fiyat (₺) *">
              <input
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0"
                inputMode="decimal"
              />
            </FormField>

            <FormField label="Kategori">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory((prev) => (prev === c ? null : c))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      category === c ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Cinsiyet">
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    type="button"
                    key={g.value}
                    onClick={() => setGender((prev) => (prev === g.value ? null : g.value))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      gender === g.value ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Renk Seçenekleri (varsa)">
              <div className="flex gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="Örn. Kırmızı"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                />
                <button type="button" onClick={addColor} className="shrink-0 rounded-lg border border-violet px-3 text-xs font-bold text-violet">
                  + Ekle
                </button>
              </div>
              {colorOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColorOptions((prev) => prev.filter((x) => x !== c))}
                      className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-bg"
                    >
                      {c} ✕
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <FormField label={isShoeCategory ? "Numara Seçenekleri (varsa)" : "Beden Seçenekleri (varsa)"}>
              <div className="flex gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  placeholder={isShoeCategory ? "Örn. 38" : "Örn. M"}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                />
                <button type="button" onClick={addSize} className="shrink-0 rounded-lg border border-violet px-3 text-xs font-bold text-violet">
                  + Ekle
                </button>
              </div>
              {sizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSizes((prev) => prev.filter((x) => x !== s))}
                      className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-bg"
                    >
                      {s} ✕
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <FormField label={combos.length > 1 ? "Stok (seçenek başına)" : "Stok Adedi *"}>
              <div className="space-y-2">
                {combos.map((c) => {
                  const k = comboKey(c.color, c.size);
                  const label = [c.color, c.size].filter(Boolean).join(" / ") || null;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      {label && <span className="flex-1 text-sm font-semibold text-ink">{label}</span>}
                      <input
                        className={`${inputClass} w-24 text-center ${!label ? "flex-1" : ""}`}
                        value={variantStocks[k] ?? "0"}
                        onChange={(e) =>
                          setVariantStocks((prev) => ({ ...prev, [k]: e.target.value.replace(/[^0-9]/g, "") }))
                        }
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                  );
                })}
              </div>
            </FormField>

            {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
