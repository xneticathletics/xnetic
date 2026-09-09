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

// İçinde bulunulan ayın (bugünün ayı) 1'i ile son günü arasındaki tarih
// aralığını döner — mobildeki src/lib/api/payments.ts getCurrentMonthRange
// ile aynı paylaşılan kaynak.
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${pad2(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad2(month + 1)}-${pad2(lastDay)}`;
  return { start, end };
}

// Tahsil edilen (bu ay FİİLEN ödenmiş — paid_at'e göre), bekleyen (bu ay
// vadeli, henüz gecikmemiş) ve vadesi geçmiş (AY SINIRI OLMAKSIZIN, geçmiş
// aylardan kalanlar dahil TÜM gecikmiş ödemeler) tutarlarını döner.
// "expected" bu üçünün basit toplamıdır.
//
// ÖNEMLİ: "Tahsil Edilen" bilerek due_date değil paid_at'e göre hesaplanır —
// aksi halde biri Eylül'de Ekim ayının aidatını erken ödediğinde para
// sessizce hiçbir ayın "Tahsil Edilen"ine yazılmıyordu (mobildeki aynı
// düzeltmeyle birebir aynı, bkz. src/lib/api/payments.ts). "Vadesi Geçmiş"
// de artık kulübün TÜM geçmişindeki pending satırlarını istemciye çekmek
// yerine tek bir SUM sorgusuyla (get_overdue_payments_total RPC) veritabanı
// tarafında hesaplanıyor — kulüp yıllar boyu kullandıkça bu sorgu hiç
// büyümüyor. Web'de branş bazlı kapsam yok (coordinator hesapları web'e hiç
// giremiyor — bkz. WEB_ALLOWED_ROLES), bu yüzden mobildeki branchName
// parametresi burada gerekmiyor.
export async function getMonthlyFinanceSummary(graceDays: number = 0): Promise<MonthlyFinanceSummary> {
  const { start, end } = getCurrentMonthRange();
  const now = new Date();
  const startOfMonthTs = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
  const startOfNextMonthTs = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0).toISOString();

  const [collectedResult, thisMonthDueResult, overdueResult] = await Promise.all([
    supabase.from("payments").select("amount").eq("status", "paid").gte("paid_at", startOfMonthTs).lt("paid_at", startOfNextMonthTs),
    supabase.from("payments").select("amount, status, due_date").gte("due_date", start).lte("due_date", end),
    supabase.rpc("get_overdue_payments_total", { p_grace_days: graceDays, p_athlete_ids: null }),
  ]);
  if (collectedResult.error) throw collectedResult.error;
  if (thisMonthDueResult.error) throw thisMonthDueResult.error;
  if (overdueResult.error) throw overdueResult.error;

  const collected = (collectedResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  let pending = 0;
  (thisMonthDueResult.data ?? []).forEach((p) => {
    if (p.status !== "paid" && !isOverdue(p as Payment, graceDays)) pending += Number(p.amount);
  });

  const overdue = Number(overdueResult.data ?? 0);

  const expected = collected + pending + overdue;

  return { expected, collected, pending, overdue };
}
