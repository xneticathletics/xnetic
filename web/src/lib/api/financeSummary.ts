import { supabase } from "../supabase";

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// "Ayın X'inden bugüne kadar" dönemini hesaplar. Bugünün günü henüz X'e
// gelmediyse (ör. başlangıç günü 5, bugün ayın 3'ü), bir önceki ayın X'inden
// başlar — kesintisiz, döngüsel bir "finansal dönem" (fatura dönemi gibi).
export function getFinancePeriodRange(startDay: number, today: Date = new Date()): { start: string; end: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  let startYear = y;
  let startMonth = m;
  if (d < startDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }
  const lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const clampedStartDay = Math.min(startDay, lastDayOfStartMonth);
  const start = new Date(startYear, startMonth, clampedStartDay);

  return { start: toISODate(start), end: toISODate(today) };
}

export type PeriodFinanceSummary = { income: number; expense: number; net: number };

// Tahsil edilmiş aidatlar + ekstra gelirler (gelir) ile giderler + antrenör
// ödemeleri (gider) toplanıp net bakiye (Ana Kasa) döner. startDate/endDate
// verilmezse TÜM zamanların toplamı hesaplanır — "bu zamana kadar giren
// çıkan hesaplandıktan sonra kalan" mantığındaki Ana Kasa'nın varsayılanı bu.
// Finans ana sayfasındaki Ana Kasa kutusu ve Finansal Dökümanlarım'daki
// "Gelir / Gider / Toplam" özeti için ortak fonksiyon.
export async function getPeriodFinanceSummary(startDate?: string, endDate?: string): Promise<PeriodFinanceSummary> {
  let paymentsQuery = supabase.from("payments").select("amount").eq("status", "paid");
  let extraIncomeQuery = supabase.from("extra_income").select("amount");
  let expensesQuery = supabase.from("expenses").select("amount");
  let coachPaymentsQuery = supabase.from("coach_payments").select("amount").eq("status", "paid");

  if (startDate) {
    paymentsQuery = paymentsQuery.gte("paid_at", startDate);
    extraIncomeQuery = extraIncomeQuery.gte("income_date", startDate);
    expensesQuery = expensesQuery.gte("expense_date", startDate);
    coachPaymentsQuery = coachPaymentsQuery.gte("paid_at", startDate);
  }
  if (endDate) {
    paymentsQuery = paymentsQuery.lte("paid_at", `${endDate}T23:59:59`);
    extraIncomeQuery = extraIncomeQuery.lte("income_date", endDate);
    expensesQuery = expensesQuery.lte("expense_date", endDate);
    coachPaymentsQuery = coachPaymentsQuery.lte("paid_at", `${endDate}T23:59:59`);
  }

  const [paymentsResult, extraIncomeResult, expensesResult, coachPaymentsResult] = await Promise.all([
    paymentsQuery,
    extraIncomeQuery,
    expensesQuery,
    coachPaymentsQuery,
  ]);
  if (paymentsResult.error) throw paymentsResult.error;
  if (extraIncomeResult.error) throw extraIncomeResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (coachPaymentsResult.error) throw coachPaymentsResult.error;

  const income =
    (paymentsResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0) +
    (extraIncomeResult.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const expense =
    (expensesResult.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0) +
    (coachPaymentsResult.data ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  return { income, expense, net: income - expense };
}
