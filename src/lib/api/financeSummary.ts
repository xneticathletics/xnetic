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

// Belirtilen tarih aralığındaki tahsil edilmiş aidatları (gelir) ve
// giderleri toplayıp net bakiyeyi döner — Finans ana sayfası ve Finansal
// Dökümanlarım'daki "Gelir / Gider / Toplam" özetleri için ortak fonksiyon.
export async function getPeriodFinanceSummary(startDate: string, endDate: string): Promise<PeriodFinanceSummary> {
  const [paymentsResult, expensesResult] = await Promise.all([
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", startDate)
      .lte("paid_at", `${endDate}T23:59:59`),
    supabase.from("expenses").select("amount").gte("expense_date", startDate).lte("expense_date", endDate),
  ]);
  if (paymentsResult.error) throw paymentsResult.error;
  if (expensesResult.error) throw expensesResult.error;

  const income = (paymentsResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const expense = (expensesResult.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  return { income, expense, net: income - expense };
}
