import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type PaymentClaimMethod = "havale" | "elden";

const PAYMENT_METHOD_LABEL: Record<PaymentClaimMethod, string> = {
  havale: "Havale/EFT",
  elden: "Elden",
};

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

export type PaymentInput = {
  athlete_id: string;
  period: PaymentPeriod;
  amount: number;
  due_date: string;
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

export async function listAthletePayments(athleteId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_FIELDS)
    .eq("athlete_id", athleteId)
    .order("due_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPayment(input: PaymentInput) {
  const { data, error } = await supabase.from("payments").insert(input).select().single();
  if (error) throw error;
  return data;
}

// Veli "Ödedim" dediğinde ödemeyi OTOMATİK "Ödendi" yapmıyoruz — havale/EFT
// ve elden ödeme her zaman gerçek dünyada bir doğrulama gerektirir. Bunun
// yerine kulüp admin(ler)ine bir bildirim gönderip, admin kendi ekranından
// kontrol edip markPaymentPaid() ile onaylayana kadar durum "Bekliyor" kalır.
export async function notifyPaymentClaim(
  amount: number,
  athleteName: string,
  method: PaymentClaimMethod
): Promise<void> {
  const { data: admins, error } = await supabase.from("users").select("id").eq("role", "club_admin").eq("is_active", true);
  if (error) throw error;

  const methodLabel = PAYMENT_METHOD_LABEL[method];
  const title = "Ödeme Bildirimi";
  const body = `${athleteName} için ${amount.toLocaleString("tr-TR")} ₺ tutarındaki aidatın ${methodLabel} ile ödendiği bildirildi — kontrol edip onaylayabilirsiniz.`;

  await Promise.all(
    (admins ?? []).map((a) => sendNotification(a.id, title, body, "payment_claim").catch(() => {}))
  );
}

export async function markPaymentPaid(id: string) {
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// DB'de otomatik "overdue" güncellemesi yapan bir zamanlanmış görev henüz yok
// (Faz 2 kapsamı) — bu yüzden vadesi geçmiş "pending" ödemeleri arayüzde
// istemci tarafında hesaplayıp gösteriyoruz. graceDays: vade tarihinden
// kaç gün sonrasına kadar "gecikmiş" sayılmasın (Gelişmiş Ayarlar'dan
// yapılandırılabilir, varsayılan 0).
export function isOverdue(payment: Payment, graceDays: number = 0): boolean {
  if (payment.status !== "pending") return false;
  const due = new Date(payment.due_date);
  due.setDate(due.getDate() + graceDays);
  // Not: toISOString() ile "bugün"ü hesaplamak UTC'ye çevirdiği için
  // UTC'nin ilerisindeki saat dilimlerinde (ör. Türkiye, UTC+3) gece
  // yarısından sonraki birkaç saatte tarihi bir gün geriye kaydırıp bir
  // ödemeyi olduğundan erken "vadesi geçmiş" gösterebilirdi — yerel
  // tarih parçalarından elle kuruyoruz.
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

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

// İçinde bulunulan ayın (bugünün ayı) 1'i ile son günü arasındaki tarih
// aralığını döner — Finans ana ekranındaki "Bu Ay Beklenen Toplam Aidat"
// kartı ile "Tahsil Edilen"/"Bekleyen" listelerinin AYNI ay penceresini
// kullanması için paylaşılan tek bir kaynak.
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${pad2(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad2(month + 1)}-${pad2(lastDay)}`;
  return { start, end };
}

// Tahsil edilen (bu ay ödenmiş), bekleyen (bu ay vadeli, henüz gecikmemiş)
// ve vadesi geçmiş (AY SINIRI OLMAKSIZIN, geçmiş aylardan kalanlar dahil
// TÜM gecikmiş ödemeler) tutarlarını döner. "expected" bu üçünün basit
// toplamıdır — Finans ekranındaki üstteki toplam rakamın, alttaki 3
// kutunun toplamıyla HER ZAMAN birebir tutması için bilerek böyle
// hesaplanır (aksi halde "Vadesi Geçmiş" geçen aylardan tutar
// içerdiğinde üstteki toplamla alttaki kutular tutmuyordu).
// graceDays: Gelişmiş Ayarlar'daki tolerans günü.
export async function getMonthlyFinanceSummary(graceDays: number = 0): Promise<MonthlyFinanceSummary> {
  const { start, end } = getCurrentMonthRange();

  const [thisMonthResult, allPendingResult] = await Promise.all([
    supabase.from("payments").select("amount, status, due_date").gte("due_date", start).lte("due_date", end),
    supabase.from("payments").select("amount, status, due_date").eq("status", "pending"),
  ]);
  if (thisMonthResult.error) throw thisMonthResult.error;
  if (allPendingResult.error) throw allPendingResult.error;

  let collected = 0;
  let pending = 0;
  (thisMonthResult.data ?? []).forEach((p) => {
    const amount = Number(p.amount);
    if (p.status === "paid") {
      collected += amount;
    } else if (!isOverdue(p as Payment, graceDays)) {
      pending += amount;
    }
  });

  let overdue = 0;
  (allPendingResult.data ?? []).forEach((p) => {
    if (isOverdue(p as Payment, graceDays)) overdue += Number(p.amount);
  });

  const expected = collected + pending + overdue;

  return { expected, collected, pending, overdue };
}
