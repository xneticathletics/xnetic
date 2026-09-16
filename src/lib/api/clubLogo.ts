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

// ÖNEMLİ: her render'da FARKLI bir cache buster EKLEMİYOR (ör.
// ?t=Date.now() gibi) — bu fonksiyon Ana Sayfa gibi ekranlarda her
// render'da çağrılıyor, ve her çağrıda farklı bir URL string'i döndürmek
// React Native'in <Image> önbelleğini tamamen devre dışı bırakıp logoyu
// HER SEFERİNDE ağdan yeniden indirtiyordu (canlıda fark edilen bir
// yavaşlığın kaynağıydı). Bunun yerine isteğe bağlı `version` (logonun
// GERÇEKTEN yüklendiği an, clubs.logo_updated_at) verilirse eklenir —
// böylece URL sadece yeni bir logo yüklendiğinde değişir, her render'da
// değil. version verilmezse (ör. henüz çekilmediyse) eski sabit davranış
// aynen sürer.
export function getClubLogoUrl(clubId: string, version?: string | null): string {
  const { data } = supabase.storage.from("club-logos").getPublicUrl(logoPath(clubId));
  return version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl;
}

// Ana Sayfa gibi logoyu SABİT bir URL ile gösteren (ve bu yüzden dosya
// değişince kendiliğinden fark etmeyen) ekranların, gerçekten yeni bir
// logo yüklenip yüklenmediğini anlaması için.
export async function getClubLogoVersion(clubId: string): Promise<string | null> {
  const { data, error } = await supabase.from("clubs").select("logo_updated_at").eq("id", clubId).maybeSingle();
  if (error) throw error;
  return data?.logo_updated_at ?? null;
}

export async function uploadClubLogo(localUri: string, clubId: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("club-logos")
    .upload(logoPath(clubId), arrayBuffer, { upsert: true, contentType: "image/png" });
  if (error) throw error;

  // Diğer ekranların (Ana Sayfa) sabit URL'i ne zaman yenileyeceğini
  // bilmesi için. clubs tablosuna doğrudan .update() ÖNCEDEN kullanılıyordu
  // ama bu, repo'daki migration'larda hiç görünmeyen (bu proje öncesinden
  // gelen) clubs UPDATE RLS politikasına bağımlıydı ve hatası sessizce
  // yutulduğu için politika izin vermediğinde fark edilmeden başarısız
  // kalıyordu — sonuç: logo_updated_at hiç değişmiyor, cache-buster URL'i
  // hiç değişmiyor, eski logo süresiz görünüyordu. SECURITY DEFINER bir
  // RPC'ye taşındı (touch_club_logo), böylece altta yatan RLS ne olursa
  // olsun her zaman çalışır — yine de kritik olmadığı için hatası burada
  // sessizce yutuluyor.
  await supabase.rpc("touch_club_logo", { p_club_id: clubId }).then(
    () => {},
    () => {}
  );

  // Buradaki cache buster BİLEREK sadece burada, yeni yüklemeden hemen
  // sonra ekleniyor — CDN/istemci önbelleğinin eski logoyu göstermeye
  // devam etmesini önlemek için, ama SADECE bu tek seferlik dönüş
  // değerinde (ekranın kendi state'ini güncellemesi için).
  return `${getClubLogoUrl(clubId)}?t=${Date.now()}`;
}
