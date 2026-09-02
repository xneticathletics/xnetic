import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

// Her kulübün logosu kendi club_id'siyle ayrılmış bir yolda tutulur
// ("<clubId>/logo.png") — birden fazla kulüp artık aynı uygulamayı
// paylaştığı için (bkz. Kulüp Oluştur), tek/ortak bir dosya yolu tüm
// kulüplerin birbirinin logosunu görmesine yol açardı. Bu yüzden logo
// SADECE oturum açıldıktan sonra (club_id bilindiğinde) gösterilir —
// Giriş ekranı artık kulübe özel değil, genel X-NETIC markasını kullanır.
function logoPath(clubId: string): string {
  return `${clubId}/logo.png`;
}

export function getClubLogoUrl(clubId: string): string {
  const { data } = supabase.storage.from("club-logos").getPublicUrl(logoPath(clubId));
  // Supabase'in CDN önbelleği eski logoyu göstermeye devam etmesin diye
  // her çağrıda bir "cache buster" ekliyoruz.
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadClubLogo(localUri: string, clubId: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("club-logos")
    .upload(logoPath(clubId), arrayBuffer, { upsert: true, contentType: "image/png" });
  if (error) throw error;

  return getClubLogoUrl(clubId);
}
