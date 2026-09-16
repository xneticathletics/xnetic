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
  // tarihi (bkz. DateField.tsx). Eskiden sadece "ayın kaçında" (day_of_month)
  // alınıyordu ve hangi ayda başlayacağı (bu ay mı gelecek ay mı) bir
  // tahminle (günü geçti mi?) belirleniyordu — artık kullanıcı ayı da
  // doğrudan seçtiği için bu tahmine gerek kalmadı.
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

// "YYYY-MM-DD" string'inden, Date'e hiç çevirmeden (saat dilimi kaymasından
// tamamen kaçınarak) aynı mutlak ay sayısını üretir.
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
// bulunuyordu — bkz. eski day_of_month-only akış). Kural:
// - first_payment_date GELECEKTE bir aydaysa (ör. plan bugün kuruldu ama
//   ilk ödeme 2 ay sonrasına seçildi), başlangıç DOĞRUDAN o ay — araya
//   giren aylar için hiç kayıt açılmaz.
// - first_payment_date bu ay veya geçmişteyse, başlangıç HER ZAMAN bugünkü
//   ay (geçmişe dönük/retroaktif ücretlendirme asla yapılmaz) — TEK istisna:
//   first_payment_date TAM bu ayı gösteriyorsa ve o günü bugünün gününden
//   zaten geçtiyse, bu ay da atlanıp bir sonraki aydan başlanır (aksi halde
//   "Bu Ay Beklenen" zaten geçmiş bir tarihi göstermeye başlardı — bkz.
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
  // Sporcunun zaten aktif bir aidat planı varsa, yenisini eklemeden önce
  // eskisini kaldırıyoruz — aksi halde iki plan aynı anda geçerli kalıp
  // sporcuya hem eski hem yeni tutardan aidat açılırdı. Eskisine bağlı,
  // henüz ÖDENMEMİŞ (pending) gelecek kayıtlar da siliniyor; zaten ÖDENMİŞ
  // kayıtlara dokunulmuyor — gerçek bir mali kayıt, geçmişi bozmamalı.
  const { data: existingPlans, error: existingPlansError } = await supabase
    .from("payment_plans")
    .select("id")
    .eq("athlete_id", input.athlete_id)
    .eq("active", true);
  if (existingPlansError) throw existingPlansError;

  if (existingPlans && existingPlans.length > 0) {
    const oldPlanIds = existingPlans.map((p) => p.id);
    const { error: deletePendingError } = await supabase
      .from("payments")
      .delete()
      .in("plan_id", oldPlanIds)
      .eq("status", "pending");
    if (deletePendingError) throw deletePendingError;

    const { error: deletePlansError } = await supabase.from("payment_plans").delete().in("id", oldPlanIds);
    if (deletePlansError) throw deletePlansError;
  }

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
