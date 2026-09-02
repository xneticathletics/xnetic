import { supabase } from "../supabase";

// Her kulübün logosu kendi club_id'siyle ayrılmış bir yolda tutulur
// ("<clubId>/logo.png") — birden fazla kulüp aynı "club-logos" bucket'ını
// paylaşıyor, tek/ortak bir dosya yolu (eski hâli: sabit "logo.png") tüm
// kulüplerin birbirinin logosunu görmesine/üzerine yazmasına yol açardı
// (bkz. mobildeki src/lib/api/clubLogo.ts — aynı mantık, birebir uyarlandı).
function logoPath(clubId: string): string {
  return `${clubId}/logo.png`;
}

export function getClubLogoUrl(clubId: string): string {
  const { data } = supabase.storage.from("club-logos").getPublicUrl(logoPath(clubId));
  // Supabase'in CDN önbelleği eski logoyu göstermeye devam etmesin diye
  // her çağrıda bir "cache buster" ekliyoruz.
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadClubLogo(file: File, clubId: string): Promise<string> {
  const { error } = await supabase.storage
    .from("club-logos")
    .upload(logoPath(clubId), file, { upsert: true, contentType: file.type || "image/png" });
  if (error) throw error;
  return getClubLogoUrl(clubId);
}
