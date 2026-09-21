import { supabase } from "../supabase";

// Her kulübün logosu kendi club_id'siyle ayrılmış bir yolda tutulur
// ("<clubId>/logo.png") — birden fazla kulüp aynı "club-logos" bucket'ını
// paylaşıyor, tek/ortak bir dosya yolu (eski hâli: sabit "logo.png") tüm
// kulüplerin birbirinin logosunu görmesine/üzerine yazmasına yol açardı
// (bkz. mobildeki src/lib/api/clubLogo.ts — aynı mantık, birebir uyarlandı).
function logoPath(clubId: string): string {
  return `${clubId}/logo.png`;
}

// ÖNEMLİ: her çağrıda FARKLI bir adres (?t=Date.now()) ÜRETMİYOR. Eskiden
// öyleydi; bu, render başına yeni bir URL demek olduğu için tarayıcı
// önbelleğini tamamen devre dışı bırakıyor ve logoyu her çizimde yeniden
// indirtiyordu (mobilde aynı hata tespit edilip düzeltilmişti — bkz.
// src/lib/api/clubLogo.ts'deki aynı uyarı). Bunun yerine logonun GERÇEKTEN
// yüklendiği an (clubs.logo_updated_at) verilirse ekleniyor: adres yalnızca
// yeni logo yüklenince değişir.
export function getClubLogoUrl(clubId: string, version?: string | null): string {
  const { data } = supabase.storage.from("club-logos").getPublicUrl(logoPath(clubId));
  return version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl;
}

export async function getClubLogoVersion(clubId: string): Promise<string | null> {
  const { data, error } = await supabase.from("clubs").select("logo_updated_at").eq("id", clubId).maybeSingle();
  if (error) throw error;
  return data?.logo_updated_at ?? null;
}

export async function uploadClubLogo(file: File, clubId: string): Promise<string> {
  const { error } = await supabase.storage
    .from("club-logos")
    .upload(logoPath(clubId), file, { upsert: true, contentType: file.type || "image/png" });
  if (error) throw error;

  // Mobil uygulama logoyu sabit bir URL ile gösteriyor ve yeni logo yüklenip
  // yüklenmediğini clubs.logo_updated_at'ten anlıyor (bkz. mobildeki
  // touch_club_logo) — web'den yüklenince bu güncellenmediği için mobilde
  // eski logo, çıkış-giriş yapılana kadar görünmeye devam ediyordu. Hatası
  // kritik değil, sessizce yutuluyor.
  await supabase.rpc("touch_club_logo", { p_club_id: clubId }).then(
    () => {},
    () => {}
  );
  // Tek seferlik cache buster: yüklemeden hemen sonra çağıranın ekranında
  // yeni logo kesin görünsün diye (sadece bu dönüş değerinde).
  return `${getClubLogoUrl(clubId)}?t=${Date.now()}`;
}
