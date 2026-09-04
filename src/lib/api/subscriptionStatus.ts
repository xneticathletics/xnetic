import { supabase } from "../supabase";

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
