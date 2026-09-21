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
// 20260905010000_manual_subscription_approval.sql, mobildeki
// src/lib/api/subscriptionStatus.ts ile birebir aynı). Kayıt hiç yoksa
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

export const BLOCKED_SUBSCRIPTION_STATUSES = ["pending_review", "past_due", "cancelled"];

// "past_due" ekranındaki "Ödedim, Bildir" butonu — mobildeki
// notifyRenewalPaymentClaim ile birebir aynı (notifications_insert_club
// RLS politikası "recipient rolü super_admin ise farklı kulüpten de olsa
// izin ver" şartını zaten içeriyor, ekstra bir edge function gerekmiyor).
export async function notifyRenewalPaymentClaim(clubName: string): Promise<void> {
  const { data: admins, error } = await supabase.from("users").select("id").eq("role", "super_admin").eq("is_active", true);
  if (error) throw error;
  const title = "Kulüp Yenileme Ödemesi Bildirdi";
  const body = `${clubName} kulübü abonelik yenileme ödemesini yaptığını bildirdi. Abonelikler ekranından kontrol edip onaylayabilirsin.`;
  await Promise.all((admins ?? []).map((a) => sendNotification(a.id, title, body, "subscription_alert").catch(() => {})));
}

// Mobildeki src/lib/api/subscriptionStatus.ts ile aynı mantık: abonelik
// kapısı JWT claim'inde tutulduğu için (bkz. custom_access_token_hook),
// süper admin onayladıktan sonra token yenilenene kadar eski "engelli"
// bilgisi taşınır. Durum serbestken token hâlâ engelli diyorsa oturumu
// bir kez tazeliyoruz — aksi halde kapı açılır ama RLS kapalı kaldığı
// için panel boş görünürdü. Tarayıcıda atob mevcut.
function tokenSaysBlocked(accessToken: string): boolean | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json)?.sub_blocked === true;
  } catch {
    return null;
  }
}

export async function refreshSubscriptionClaimIfStale(status: ClubSubscriptionStatus | null): Promise<boolean> {
  if (status && BLOCKED_SUBSCRIPTION_STATUSES.includes(status.status)) return false;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token || tokenSaysBlocked(token) !== true) return false;
  try {
    const { error } = await supabase.auth.refreshSession();
    // Hata olursa oturum ASLA kapatılmıyor.
    return !error;
  } catch {
    return false;
  }
}
