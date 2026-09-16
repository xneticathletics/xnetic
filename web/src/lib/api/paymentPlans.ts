import { supabase } from "../supabase";

export type PaymentPlan = {
  id: string;
  athlete_id: string;
  amount: number;
  day_of_month: number;
  first_payment_date: string | null;
  active: boolean;
  created_at: string;
};

export type PaymentPlanInput = {
  athlete_id: string;
  amount: number;
  // "YYYY-MM-DD" — kullanıcının gün/ay/yıl seçerek belirlediği ilk ödeme
  // tarihi (mobildeki DateField.tsx ile aynı fikir). Eskiden sadece "ayın
  // kaçında" alınıyordu ve hangi ayda başlayacağı bir tahminle belirleniyordu.
  first_payment_date: string;
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
// Yerel tarih parçalarından elle string kurmak bu sorunu tamamen ortadan
// kaldırır (mobildeki aynı fonksiyonla birebir aynı — bkz. src/lib/api/paymentPlans.ts).
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

// "YYYY-MM-DD" string'inden, Date'e hiç çevirmeden aynı mutlak ay sayısını üretir.
function monthIndexOfDateKey(dateKey: string): number {
  const [y, m] = dateKey.split("-").map(Number);
  return y * 12 + (m - 1);
}

type PendingPaymentRow = { plan_id: string; athlete_id: string; period: "monthly"; amount: number; due_date: string };

// Bir plan için, eksik olan ayların payments satırlarını HESAPLAR (henüz
// yazmaz) — due_date bazında, zaten var olan ayları tekrarlamaz. topUpPlan
// (tekil) ve topUpAllActivePlans (toplu) bu tek hesaplamayı paylaşır.
//
// Başlangıç ayı artık kullanıcının seçtiği first_payment_date'in AYINA göre
// belirleniyor (eskiden "created_at'in ayı + günü geçti mi?" tahminiyle
// bulunuyordu — bkz. mobildeki src/lib/api/paymentPlans.ts'teki aynı
// gerekçeli değişiklik). Kural:
// - first_payment_date GELECEKTE bir aydaysa, başlangıç doğrudan o ay.
// - first_payment_date bu ay veya geçmişteyse, başlangıç HER ZAMAN bugünkü
//   ay (retroaktif ücretlendirme yok) — first_payment_date TAM bu ayı
//   gösteriyorsa ve günü zaten geçtiyse bir sonraki aydan başlanır (bkz.
//   src/lib/api/payments.ts getMonthlyFinanceSummary).
function computeMissingRows(plan: PaymentPlan, existingDates: Set<string>): PendingPaymentRow[] {
  const now = new Date();
  const nowMonthIndex = monthIndexOf(now);
  const anchorDateKey = plan.first_payment_date ?? plan.created_at.slice(0, 10);
  const anchorMonthIndex = monthIndexOfDateKey(anchorDateKey);
  const anchorIsCurrentMonth = anchorMonthIndex === nowMonthIndex;
  const currentMonthDayAlreadyPassed = anchorIsCurrentMonth && plan.day_of_month < now.getDate();
  const baseStartMonthIndex = Math.max(anchorMonthIndex, nowMonthIndex);
  const startMonthIndex = currentMonthDayAlreadyPassed ? baseStartMonthIndex + 1 : baseStartMonthIndex;

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
// kullanıyoruz: aynı anda iki tazeleme çağrısı (ör. kullanıcı sayfayı iki kez
// art arda açtı) çakışsa bile artık ikinci satır sessizce atlanır, kopya
// oluşmaz (önceden N+1 + düz insert bu yarış durumunda gerçek kopya
// üretiyordu — bkz. security/performans notu topUpAllActivePlans'ta).
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
  const day_of_month = Number(input.first_payment_date.split("-")[2]);
  const { data, error } = await supabase
    .from("payment_plans")
    .insert({ athlete_id: input.athlete_id, amount: input.amount, day_of_month, first_payment_date: input.first_payment_date })
    .select()
    .single();
  if (error) throw error;
  await topUpPlan(data as PaymentPlan);
  return data;
}

// Kulüpteki tüm aktif planları, her sayfa açılışında 3 aylık ufka göre
// tazeler — bu sayede geçmiş zaman ne olursa olsun her zaman önümüzdeki
// 3 ay dolu bulunur, elle bir şey yapmaya gerek kalmaz.
//
// ÖNEMLİ: önceden plan başına ayrı select+insert yapan bir döngüydü (N+1) —
// yüzlerce planlı bir kulüpte onlarca saniye sürüp sayfayı "sonsuza kadar
// yükleniyor" gibi gösteriyordu. Artık TÜM planları ve TÜM mevcut ödemelerini
// ikişer sorguyla çekip tek bir toplu upsert ile tazeliyor.
export async function topUpAllActivePlans() {
  const { data: plans, error } = await supabase
    .from("payment_plans")
    .select("id, athlete_id, amount, day_of_month, first_payment_date, active, created_at")
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
