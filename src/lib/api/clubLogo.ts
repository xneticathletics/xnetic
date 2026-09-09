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

// ÖNEMLİ: bilerek bir "cache buster" (ör. ?t=Date.now()) EKLEMİYOR — bu
// fonksiyon Ana Sayfa gibi ekranlarda her render'da çağrılıyor, ve her
// çağrıda farklı bir URL string'i döndürmek React Native'in <Image>
// önbelleğini tamamen devre dışı bırakıp logoyu HER SEFERİNDE ağdan
// yeniden indirtiyordu (canlıda fark edilen bir yavaşlığın kaynağıydı).
// URL sabit olduğu sürece RN aynı görseli önbellekten anında gösterir.
export function getClubLogoUrl(clubId: string): string {
  const { data } = supabase.storage.from("club-logos").getPublicUrl(logoPath(clubId));
  return data.publicUrl;
}

export async function uploadClubLogo(localUri: string, clubId: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("club-logos")
    .upload(logoPath(clubId), arrayBuffer, { upsert: true, contentType: "image/png" });
  if (error) throw error;

  // Buradaki cache buster BİLEREK sadece burada, yeni yüklemeden hemen
  // sonra ekleniyor — CDN/istemci önbelleğinin eski logoyu göstermeye
  // devam etmesini önlemek için, ama SADECE bu tek seferlik dönüş
  // değerinde (ekranın kendi state'ini güncellemesi için).
  return `${getClubLogoUrl(clubId)}?t=${Date.now()}`;
}
