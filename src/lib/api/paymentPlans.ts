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

type PendingPaymentRow = { plan_id: string; athlete_id: string; period: "monthly"; amount: number; due_date: string };

// Bir plan için, eksik olan ayların payments satırlarını HESAPLAR (henüz
// yazmaz) — due_date bazında, zaten var olan ayları tekrarlamaz. Planın
// OLUŞTURULDUĞU ay HİÇBİR ZAMAN bir ödeme ayı değildir — ilk ödeme her
// zaman plan kaydından sonraki ilk aydır. topUpPlan (tekil) ve
// topUpAllActivePlans (toplu) bu tek hesaplamayı paylaşır.
function computeMissingRows(plan: PaymentPlan, existingDates: Set<string>): PendingPaymentRow[] {
  const nowMonthIndex = monthIndexOf(new Date());
  const firstAllowedMonthIndex = monthIndexOf(new Date(plan.created_at)) + 1;
  const startMonthIndex = Math.max(nowMonthIndex, firstAllowedMonthIndex);

  const rows: PendingPaymentRow[] = [];
  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const targetMonthIndex = startMonthIndex + i;
    const targetYear = Math.floor(targetMonthIndex / 12);
    const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
    const dueDate = computeDueDate(targetYear, normalizedMonth, plan.day_of_month);
    if (!existingDates.has(dueDate)) {
      rows.push({ plan_id: plan.id, athlete_id: plan.athlete_id, period: "monthly", amount: plan.amount, due_date: dueDate });
    }
  }
  return rows;
}

// payments(plan_id, due_date) üzerinde bir eşsizlik kısıtı var (bkz. migration
// 20260906020000) — bu yüzden düz insert yerine upsert+ignoreDuplicates
// kullanıyoruz: aynı anda iki tazeleme çağrısı çakışsa bile ikinci satır
// sessizce atlanır, kopya oluşmaz.
export async function topUpPlan(plan: PaymentPlan) {
  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("due_date")
    .eq("plan_id", plan.id);
  if (existingError) throw existingError;

  const rows = computeMissingRows(plan, new Set((existing ?? []).map((e) => e.due_date)));
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("payments").upsert(rows, { onConflict: "plan_id,due_date", ignoreDuplicates: true });
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
//
// ÖNEMLİ: önceden plan başına ayrı select+insert yapan bir döngüydü (N+1) —
// yüzlerce planlı bir kulüpte onlarca saniye sürüp ekranı "sonsuza kadar
// yükleniyor" gibi gösteriyordu. Artık TÜM planları ve TÜM mevcut ödemelerini
// ikişer sorguyla çekip tek bir toplu upsert ile tazeliyor.
export async function topUpAllActivePlans() {
  const { data: plans, error } = await supabase
    .from("payment_plans")
    .select("id, athlete_id, amount, day_of_month, active, created_at")
    .eq("active", true);
  if (error) throw error;
  if (!plans || plans.length === 0) return;

  const planIds = plans.map((p) => p.id);
  const { data: existingPayments, error: existingError } = await supabase
    .from("payments")
    .select("plan_id, due_date")
    .in("plan_id", planIds);
  if (existingError) throw existingError;

  const existingByPlan = new Map<string, Set<string>>();
  for (const row of existingPayments ?? []) {
    if (!row.plan_id) continue;
    if (!existingByPlan.has(row.plan_id)) existingByPlan.set(row.plan_id, new Set());
    existingByPlan.get(row.plan_id)!.add(row.due_date);
  }

  const rows: PendingPaymentRow[] = [];
  for (const plan of plans as PaymentPlan[]) {
    rows.push(...computeMissingRows(plan, existingByPlan.get(plan.id) ?? new Set()));
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("payments").upsert(rows, { onConflict: "plan_id,due_date", ignoreDuplicates: true });
    if (insertError) throw insertError;
  }
}
