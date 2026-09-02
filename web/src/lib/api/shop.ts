import { supabase } from "../supabase";

// Bu dosya, mobil uygulamadaki src/lib/api/shop.ts ile aynı tablo/kolonları ve
// aynı Supabase backend'ini kullanır — web panelde sadece admin/muhasebe
// tarafından kullanılan fonksiyonlar (ürün/sipariş/stok yönetimi) taşınmıştır.
// Veli/sporcu tarafındaki satın alma akışı (listActiveProducts, createOrder,
// listMyOrders) web panelde yok, bu yüzden buraya taşınmadı.

export type ShopOrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
export type ShopPaymentMethod = "havale" | "elden";

export type ShopGender = "kadin" | "erkek" | "unisex";

export type ShopProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  photo_urls: string[];
  is_active: boolean;
  created_at: string;
  category: string | null;
  gender: ShopGender | null;
};

export type ShopProductAdmin = ShopProduct & { totalStock: number };

export type ShopVariant = { id: string; color: string | null; size: string | null };
export type ShopVariantAdmin = ShopVariant & { stock: number };

export type ShopOrder = {
  id: string;
  product_id: string;
  variant_id: string | null;
  parent_user_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: ShopPaymentMethod;
  note: string | null;
  status: ShopOrderStatus;
  created_at: string;
  shop_products?: { title: string } | null;
  shop_product_variants?: { color: string | null; size: string | null } | null;
  users?: { name: string; phone: string | null } | null;
};

const PRODUCT_FIELDS = "id, title, description, price, photo_urls, is_active, created_at, category, gender";
const ORDER_FIELDS =
  "id, product_id, variant_id, parent_user_id, quantity, unit_price, total_price, payment_method, note, status, created_at";

export function variantLabel(v: { color: string | null; size: string | null } | null | undefined): string | null {
  if (!v) return null;
  const parts = [v.color, v.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

// Mağazayı yönetenler (admin/muhasebe) — pasif ürünler dahil hepsini, tüm
// varyantların toplam stok adediyle birlikte görür.
export async function listAllProducts(): Promise<ShopProductAdmin[]> {
  const { data, error } = await supabase
    .from("shop_products")
    .select(`${PRODUCT_FIELDS}, shop_product_variants(shop_product_variant_stock(stock))`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((p) => ({
    ...p,
    totalStock: (p.shop_product_variants ?? []).reduce(
      (sum: number, v: any) => sum + (v.shop_product_variant_stock?.stock ?? 0),
      0
    ),
  }));
}

export async function getProductAdmin(id: string): Promise<ShopProduct> {
  const { data, error } = await supabase.from("shop_products").select(PRODUCT_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data;
}

// Admin ürün formu / stok ekranı için — stok adedi dahil.
export async function listProductVariantsAdmin(productId: string): Promise<ShopVariantAdmin[]> {
  const { data, error } = await supabase
    .from("shop_product_variants")
    .select("id, color, size, shop_product_variant_stock(stock)")
    .eq("product_id", productId)
    .order("color", { ascending: true })
    .order("size", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as any[]).map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.shop_product_variant_stock?.stock ?? 0 }));
}

export type VariantCombo = { color: string | null; size: string | null; stock: number };

// Ürünün renk/beden varyantlarını ve stoklarını, formda girilen listeyle
// birebir eşleşecek şekilde senkronize eder — kalanların stoğunu günceller,
// yenileri ekler, formdan çıkarılanları siler (o varyanta ait geçmiş
// siparişler variant_id'si null'a düşer, sipariş kaydı silinmez).
export async function saveProductVariants(productId: string, combos: VariantCombo[]): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from("shop_product_variants")
    .select("id, color, size")
    .eq("product_id", productId);
  if (existingError) throw existingError;

  const key = (color: string | null, size: string | null) => `${color ?? ""} ${size ?? ""}`;
  const existingByKey = new Map((existing ?? []).map((v) => [key(v.color, v.size), v.id as string]));
  const comboKeys = new Set(combos.map((c) => key(c.color, c.size)));

  const toDelete = (existing ?? []).filter((v) => !comboKeys.has(key(v.color, v.size))).map((v) => v.id);
  if (toDelete.length > 0) {
    const { error } = await supabase.from("shop_product_variants").delete().in("id", toDelete);
    if (error) throw error;
  }

  for (const combo of combos) {
    const existingId = existingByKey.get(key(combo.color, combo.size));
    if (existingId) {
      const { error } = await supabase
        .from("shop_product_variant_stock")
        .upsert({ variant_id: existingId, stock: combo.stock }, { onConflict: "variant_id" });
      if (error) throw error;
    } else {
      const { data: variant, error: variantError } = await supabase
        .from("shop_product_variants")
        .insert({ product_id: productId, color: combo.color, size: combo.size })
        .select("id")
        .single();
      if (variantError) throw variantError;
      const { error: stockError } = await supabase
        .from("shop_product_variant_stock")
        .insert({ variant_id: variant.id, stock: combo.stock });
      if (stockError) throw stockError;
    }
  }
}

// Stok ekranından hızlı adet güncellemesi.
export async function updateVariantStock(variantId: string, stock: number) {
  const { error } = await supabase.from("shop_product_variant_stock").upsert({ variant_id: variantId, stock }, { onConflict: "variant_id" });
  if (error) throw error;
}

export type ShopProductInput = {
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  gender: ShopGender | null;
};

export async function createProduct(input: ShopProductInput): Promise<ShopProduct> {
  const { data, error } = await supabase.from("shop_products").insert(input).select(PRODUCT_FIELDS).single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, input: Partial<ShopProductInput & { is_active: boolean }>) {
  const { error } = await supabase.from("shop_products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("shop_products").delete().eq("id", id);
  if (error) throw error;
}

// Ürüne fotoğraf ekler — bucket private olduğu için ~10 yıllık imzalı URL
// üretip photo_urls dizisine ekler (en fazla 5, DB constraint'i de garanti eder).
export async function addProductPhoto(productId: string, file: File, existingUrls: string[]): Promise<string[]> {
  if (existingUrls.length >= 5) throw new Error("En fazla 5 fotoğraf eklenebilir.");

  const fileExt = file.name.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const path = `${productId}/${Date.now()}.${fileExt}`;
  const contentType = file.type || (fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`);

  const { error: uploadError } = await supabase.storage.from("shop-photos").upload(path, file, { contentType });
  if (uploadError) throw uploadError;

  const { data: signedData, error: signError } = await supabase.storage.from("shop-photos").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const newUrls = [...existingUrls, signedData.signedUrl];
  const { error: updateError } = await supabase.from("shop_products").update({ photo_urls: newUrls }).eq("id", productId);
  if (updateError) throw updateError;

  return newUrls;
}

export async function removeProductPhoto(productId: string, url: string, existingUrls: string[]): Promise<string[]> {
  const newUrls = existingUrls.filter((u) => u !== url);
  const { error } = await supabase.from("shop_products").update({ photo_urls: newUrls }).eq("id", productId);
  if (error) throw error;
  return newUrls;
}

// --- Siparişler ---

// Admin/muhasebe — kulübün tüm siparişlerini görür.
export async function listAllOrders(): Promise<ShopOrder[]> {
  const { data, error } = await supabase
    .from("shop_orders")
    .select(`${ORDER_FIELDS}, shop_products(title), shop_product_variants(color, size), users:parent_user_id(name, phone)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ShopOrder[]) ?? [];
}

// "Siparişler" sayfasındaki rozet için — henüz incelenmemiş (bekleyen)
// sipariş sayısı.
export async function getPendingOrderCount(): Promise<number> {
  const { count, error } = await supabase.from("shop_orders").select("id", { count: "exact", head: true }).eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

// Durum güncellemesi RPC üzerinden yapılır — onaylanınca finansa otomatik
// gelir işlenir, iptal edilince stok iade edilir (bkz. mobil migration yorumu).
export async function updateOrderStatus(id: string, status: ShopOrderStatus) {
  const { error } = await supabase.rpc("update_shop_order_status", { p_order_id: id, p_status: status });
  if (error) throw error;
}
