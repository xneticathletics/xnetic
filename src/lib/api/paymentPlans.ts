import { supabase } from "../supabase";

export type PaymentPlan = {
  id: string;
  athlete_id: string;
  amount: number;
  day_of_month: number;
  active: boolean;
  created_at: string;
};

export type PaymentPlanInput = {
  athlete_id: string;
  amount: number;
  day_of_month: number;
};

// Kaç ay ilerisi için ödeme kaydı hazır bulunsun (bugünkü ay dahil).
const MONTHS_AHEAD = 3;

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

// Not: kasıtlı olarak toISOString() KULLANILMIYOR — o, tarihi UTC'ye
// çevirir ve UTC'nin gerisindeki saat dilimlerinde (ör. Türkiye, UTC+3)
// ayın son günü/başı gibi durumlarda tarihi bir gün geriye kaydırabilir
// (ör. yerel 28'i, UTC'de bir önceki günün gecesine denk gelebilir).
// Yerel tarih parçalarından elle string kurmak bu sorunu tamamen ortadan kaldırır.
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

// Bir plan için, eksik olan payments kayıtlarını oluşturur. Zaten var olan
// ayları tekrar eklemez (due_date bazında kontrol eder). Planın
// OLUŞTURULDUĞU ay HİÇBİR ZAMAN bir ödeme ayı değildir — ilk ödeme her
// zaman plan kaydından sonraki ilk aydır. Bu kural plan.created_at'a
// dayandığı için, topUpPlan İSTER ilk oluşturma anında ister düzenli
// tazeleme sırasında (topUpAllActivePlans) çağrılsın her zaman geçerlidir
// — bu sayede sonraki bir tazeleme çağrısı atlanan ayı yanlışlıkla geri
// eklemez.
export async function topUpPlan(plan: PaymentPlan) {
  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("due_date")
    .eq("plan_id", plan.id);
  if (existingError) throw existingError;

  const existingDates = new Set((existing ?? []).map((e) => e.due_date));
  const nowMonthIndex = monthIndexOf(new Date());
  const firstAllowedMonthIndex = monthIndexOf(new Date(plan.created_at)) + 1;
  const startMonthIndex = Math.max(nowMonthIndex, firstAllowedMonthIndex);

  const rows: { plan_id: string; athlete_id: string; period: "monthly"; amount: number; due_date: string }[] = [];

  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const targetMonthIndex = startMonthIndex + i;
    const targetYear = Math.floor(targetMonthIndex / 12);
    const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
    const dueDate = computeDueDate(targetYear, normalizedMonth, plan.day_of_month);

    if (!existingDates.has(dueDate)) {
      rows.push({
        plan_id: plan.id,
        athlete_id: plan.athlete_id,
        period: "monthly",
        amount: plan.amount,
        due_date: dueDate,
      });
    }
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("payments").insert(rows);
    if (insertError) throw insertError;
  }
}

export async function createPaymentPlan(input: PaymentPlanInput) {
  const { data, error } = await supabase.from("payment_plans").insert(input).select().single();
  if (error) throw error;
  await topUpPlan(data as PaymentPlan);
  return data;
}

// Kulüpteki tüm aktif planları, her ekran açılışında 3 aylık ufka göre
// tazeler — bu sayede geçmiş zaman ne olursa olsun her zaman önümüzdeki
// 3 ay dolu bulunur, elle bir şey yapmaya gerek kalmaz.
export async function topUpAllActivePlans() {
  const { data: plans, error } = await supabase
    .from("payment_plans")
    .select("id, athlete_id, amount, day_of_month, active, created_at")
    .eq("active", true);
  if (error) throw error;

  for (const plan of plans ?? []) {
    await topUpPlan(plan as PaymentPlan);
  }
}
