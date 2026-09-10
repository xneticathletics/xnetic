import { supabase } from "../supabase";

export type PaymentStatus = "pending" | "paid" | "overdue";
export type PaymentPeriod = "weekly" | "monthly" | "yearly";

export type Payment = {
  id: string;
  athlete_id: string;
  period: PaymentPeriod;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: PaymentStatus;
  athletes?: {
    full_name: string;
    parent_name: string | null;
    parent_phone: string | null;
    parent_user_id: string | null;
    groups?: { branch: string } | null;
  } | null;
};

const PAYMENT_FIELDS = "id, athlete_id, period, amount, due_date, paid_at, status";

export async function listClubPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(`${PAYMENT_FIELDS}, athletes(full_name, parent_name, parent_phone, parent_user_id, groups!group_id(branch))`)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data as unknown as Payment[]) ?? [];
}

export async function markPaymentPaid(id: string) {
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function isOverdue(payment: Payment, graceDays: number = 0): boolean {
  if (payment.status !== "pending") return false;
  const due = new Date(payment.due_date);
  due.setDate(due.getDate() + graceDays);
  // Not: toISOString() ile "bugün"ü hesaplamak UTC'ye çevirdiği için
  // UTC'nin ilerisindeki saat dilimlerinde (ör. Türkiye, UTC+3) gece
  // yarısından sonraki birkaç saatte tarihi bir gün geriye kaydırıp bir
  // ödemeyi olduğundan erken "vadesi geçmiş" gösterebilirdi — yerel
  // tarih parçalarından elle kuruyoruz (mobildeki aynı fonksiyonla
  // birebir aynı — bkz. src/lib/api/payments.ts).
  const now = new Date();
  const todayLocal = new Date(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`);
  return due < todayLocal;
}

export type MonthlyFinanceSummary = {
  expected: number;
  collected: number;
  pending: number;
  overdue: number;
};

// "expected" (Bu Ay Beklenen), TÜM AKTİF aidat planlarının toplam tutarıdır
// — "her şey normal giderse bu ay toplam ne kadar tahsil edilmeli" sorusunun
// cevabı. "pending" (Bekleyen) bu toplamdan bu ay tahsil edileni düşer,
// tahsilat arttıkça geriler.
//
// ÖNEMLİ: eskiden "expected"/"pending", o ayki due_date'e sahip `payments`
// satırlarından hesaplanıyordu — ama yeni oluşturulan bir plan için ilk
// `payments` satırı ancak gelecek ay üretiliyor (bkz. paymentPlans.ts
// computeMissingRows: planın oluşturulduğu ay hiçbir zaman bir ödeme ayı
// değildir). Bu yüzden o ay içinde kurulan planlar için "Bu Ay Beklenen"
// hep 0 TL görünüyordu, gerçekte o sporcuların aidatı olsa bile.
// `payment_plans` tablosundan doğrudan toplamak bu satır üretim
// zamanlamasından tamamen bağımsız, her zaman doğru bir rakam verir.
//
// "Tahsil Edilen" bilerek due_date değil paid_at'e göre hesaplanır —
// aksi halde biri Eylül'de Ekim ayının aidatını erken ödediğinde para
// sessizce hiçbir ayın "Tahsil Edilen"ine yazılmıyordu (mobildeki aynı
// düzeltmeyle birebir aynı, bkz. src/lib/api/payments.ts).
//
// "Vadesi Geçmiş" AY SINIRI OLMAKSIZIN, geçmiş aylardan kalanlar dahil
// TÜM gecikmiş ödemeleri kapsar — bilerek "expected"in dışında, ayrı bir
// kalem; kulübün TÜM geçmişindeki pending satırlarını istemciye çekmek
// yerine tek bir SUM sorgusuyla (get_overdue_payments_total RPC) veritabanı
// tarafında hesaplanıyor. Web'de branş bazlı kapsam yok (coordinator
// hesapları web'e hiç giremiyor — bkz. WEB_ALLOWED_ROLES), bu yüzden
// mobildeki branchName parametresi burada gerekmiyor.
export async function getMonthlyFinanceSummary(graceDays: number = 0): Promise<MonthlyFinanceSummary> {
  const now = new Date();
  const startOfMonthTs = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
  const startOfNextMonthTs = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0).toISOString();

  const [collectedResult, activePlansResult, overdueResult] = await Promise.all([
    supabase.from("payments").select("amount").eq("status", "paid").gte("paid_at", startOfMonthTs).lt("paid_at", startOfNextMonthTs),
    supabase.from("payment_plans").select("amount").eq("active", true),
    supabase.rpc("get_overdue_payments_total", { p_grace_days: graceDays, p_athlete_ids: null }),
  ]);
  if (collectedResult.error) throw collectedResult.error;
  if (activePlansResult.error) throw activePlansResult.error;
  if (overdueResult.error) throw overdueResult.error;

  const collected = (collectedResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const expected = (activePlansResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const overdue = Number(overdueResult.data ?? 0);
  const pending = Math.max(expected - collected, 0);

  return { expected, collected, pending, overdue };
}
