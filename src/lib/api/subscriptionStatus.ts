import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type ClubSubscriptionStatus = {
  status: string;
  billingPeriod: string;
  amountTry: number;
  currentPeriodEnd: string | null;
};

// Kulüp admininin kendi kulübünün abonelik durumunu okuması için — RLS
// zaten club_id = current_club_id() ile sınırlıyor (bkz. migration
// 20260905010000_manual_subscription_approval.sql). Kayıt hiç yoksa
// (bu değişiklikten önce açılmış eski bir kulüp) null döner — bu durumda
// hiçbir kilit uygulanmaz, geriye dönük uyumluluk için.
export async function getMySubscriptionStatus(): Promise<ClubSubscriptionStatus | null> {
  const { data, error } = await supabase
    .from("club_subscriptions")
    .select("status, billing_period, amount_try, current_period_end")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    status: data.status,
    billingPeriod: data.billing_period,
    amountTry: data.amount_try,
    currentPeriodEnd: data.current_period_end,
  };
}

// Bu durumlarda kulüp admini App'e alınmaz, bilgilendirme ekranı gösterilir.
// 'mock_paid' ve 'active' (ve kayıt hiç yoksa) serbest — geriye dönük uyumluluk.
export const BLOCKED_SUBSCRIPTION_STATUSES = ["pending_review", "past_due", "cancelled"];

// "past_due" ekranındaki "Ödedim, Bildir" butonu — yeni kulüp kaydındaki
// create-club edge function'ının süper adminlere attığı bildirimle aynı
// ruhta, ama burada zaten GİRİŞ YAPMIŞ (sadece pending gate'te bekleyen)
// bir club_admin'den geliyor, bu yüzden normal client-side sendNotification()
// yeterli — notifications_insert_club RLS politikası zaten "recipient rolü
// super_admin ise farklı kulüpten de olsa izin ver" şartını içeriyor.
export async function notifyRenewalPaymentClaim(clubName: string): Promise<void> {
  const { data: admins, error } = await supabase.from("users").select("id").eq("role", "super_admin").eq("is_active", true);
  if (error) throw error;
  const title = "Kulüp Yenileme Ödemesi Bildirdi";
  const body = `${clubName} kulübü abonelik yenileme ödemesini yaptığını bildirdi. Abonelikler ekranından kontrol edip onaylayabilirsin.`;
  await Promise.all((admins ?? []).map((a) => sendNotification(a.id, title, body, "subscription_alert").catch(() => {})));
}

// --- Token tazeleme (abonelik onayından sonra bekletmemek için) ---
//
// Abonelik kapısı artık JWT claim'inde: engelli bir kulüp yöneticisinin
// token'ında club_id NULL yazıyor (bkz. custom_access_token_hook). Bu,
// kapının RLS maliyetini sıfıra indiriyor ama bir yan etkisi var: süper
// admin kulübü onayladığında, token yenilenene kadar (~1 saat) eski
// "engelli" bilgisi taşınmaya devam ediyor. O sırada abonelik durumu
// "aktif" göründüğü için kapı açılır ama RLS hâlâ kapalı olduğundan
// kullanıcı BOŞ bir uygulama görürdü. Bunu önlemek için: durum artık
// engelli değilken token hâlâ "engelli" diyorsa, oturumu bir kez
// tazeliyoruz.

function decodeBase64Url(input: string): string {
  // Hermes'te atob her sürümde garanti değil — bağımlılıksız, saf çözüm.
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  let out = "";
  let buffer = 0;
  let bits = 0;
  for (const ch of base64) {
    const idx = chars.indexOf(ch);
    if (idx === -1) continue; // '=' dolgusu ve bozuk karakterler atlanır
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
}

// Elimizdeki access token "engelli" mi diyor? Ağ çağrısı yok.
async function tokenSaysBlocked(): Promise<boolean | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(decodeBase64Url(payload));
    return claims?.sub_blocked === true;
  } catch {
    return null;
  }
}

// Durum artık serbestken token hâlâ engelli diyorsa oturumu tazeler.
// true dönerse çağıran abonelik durumunu yeniden okumalı.
export async function refreshSubscriptionClaimIfStale(status: ClubSubscriptionStatus | null): Promise<boolean> {
  if (status && BLOCKED_SUBSCRIPTION_STATUSES.includes(status.status)) return false;
  const blocked = await tokenSaysBlocked();
  if (blocked !== true) return false;
  try {
    const { error } = await supabase.auth.refreshSession();
    // Hata olursa oturumu ASLA kapatmıyoruz — kullanıcı en kötü ihtimalle
    // bekleme ekranında kalır ve uygulamayı yeniden açınca düzelir.
    return !error;
  } catch {
    return false;
  }
}
