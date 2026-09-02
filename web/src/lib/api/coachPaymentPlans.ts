import { supabase } from "../supabase";

export type CoachPaymentPlan = {
  id: string;
  coach_id: string;
  amount: number;
  day_of_month: number;
  active: boolean;
  created_at: string;
};

export type CoachPaymentPlanInput = {
  coach_id: string;
  amount: number;
  day_of_month: number;
};

// Kaç ay ilerisi için ödeme kaydı hazır bulunsun (bugünkü ay dahil). Antrenör
// ödemeleri sporcu aidatlarından farklı olarak sadece İÇİNDE BULUNULAN ayın
// kaydını gösterir — bir sonraki ayın "bekliyor" kaydı, o ay geldiğinde
// (ekran her açıldığında topUpAllActiveCoachPlans çalıştığı için) otomatik
// oluşur, önceden 3 ay birden görünmez.
const MONTHS_AHEAD = 1;

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

// Not: kasıtlı olarak toISOString() KULLANILMIYOR — bkz. paymentPlans.ts'deki
// aynı notta açıklanan UTC kaynaklı gün kayması sorunu.
function computeDueDate(year: number, monthIndex0: number, day: number): string {
  const lastDayOfMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(clampedDay)}`;
}

// Ocak 2000'den itibaren mutlak ay sayısı (yıl*12+ay) — ay bazında
// karşılaştırma/toplama için yıl sınırını elle yönetmeye gerek bırakmaz.
function monthIndexOf(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

// Bir plan için, eksik olan coach_payments kayıtlarını oluşturur. Zaten var
// olan ayları tekrar eklemez (due_date bazında kontrol eder). Planın
// OLUŞTURULDUĞU ay HİÇBİR ZAMAN bir ödeme ayı değildir — ilk ödeme her
// zaman plan kaydından sonraki ilk aydır (aidat planlarıyla aynı kural).
export async function topUpCoachPlan(plan: CoachPaymentPlan) {
  const { data: existing, error: existingError } = await supabase
    .from("coach_payments")
    .select("due_date")
    .eq("plan_id", plan.id);
  if (existingError) throw existingError;

  const existingDates = new Set((existing ?? []).map((e) => e.due_date));
  const nowMonthIndex = monthIndexOf(new Date());
  const firstAllowedMonthIndex = monthIndexOf(new Date(plan.created_at)) + 1;
  const startMonthIndex = Math.max(nowMonthIndex, firstAllowedMonthIndex);

  const rows: { plan_id: string; coach_id: string; amount: number; due_date: string }[] = [];

  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const targetMonthIndex = startMonthIndex + i;
    const targetYear = Math.floor(targetMonthIndex / 12);
    const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
    const dueDate = computeDueDate(targetYear, normalizedMonth, plan.day_of_month);

    if (!existingDates.has(dueDate)) {
      rows.push({ plan_id: plan.id, coach_id: plan.coach_id, amount: plan.amount, due_date: dueDate });
    }
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("coach_payments").insert(rows);
    if (insertError) throw insertError;
  }
}

export async function createCoachPaymentPlan(input: CoachPaymentPlanInput) {
  const { data, error } = await supabase.from("coach_payment_plans").insert(input).select().single();
  if (error) throw error;
  await topUpCoachPlan(data as CoachPaymentPlan);
  return data;
}

// Kulüpteki tüm aktif antrenör ödeme planlarını, her sayfa açılışında
// tazeler — zaman ne kadar geçmiş olursa olsun güncel ay otomatik olarak
// "bekliyor" durumunda hazır bulunur.
export async function topUpAllActiveCoachPlans() {
  const { data: plans, error } = await supabase
    .from("coach_payment_plans")
    .select("id, coach_id, amount, day_of_month, active, created_at")
    .eq("active", true);
  if (error) throw error;

  for (const plan of plans ?? []) {
    await topUpCoachPlan(plan as CoachPaymentPlan);
  }
}
