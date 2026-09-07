import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
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
  receipt_url: string | null;
  method: "bank_transfer" | "cash" | "credit_card" | "qr" | null;
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

const PAYMENT_FIELDS = "id, athlete_id, period, amount, due_date, paid_at, status, receipt_url, method";

export const PAYMENT_METHOD_DB_LABEL: Record<string, string> = {
  bank_transfer: "Havale/EFT",
  cash: "Elden",
  credit_card: "Kredi Kartı",
  qr: "QR",
};

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
// yerine kulüp admin(ler)ine, sporcunun grubunun baş antrenörüne ve branş
// koordinatörüne bir bildirim gönderip, biri kendi ekranından kontrol edip
// markPaymentPaid() ile onaylayana kadar durum "Bekliyor" kalır.
export async function notifyPaymentClaim(
  paymentId: string,
  amount: number,
  athleteName: string,
  method: PaymentClaimMethod,
  hasReceipt: boolean = false
): Promise<void> {
  const { data: admins, error } = await supabase.from("users").select("id").eq("role", "club_admin").eq("is_active", true);
  if (error) throw error;

  const recipients = new Set<string>((admins ?? []).map((a) => a.id));

  const { data: payment } = await supabase
    .from("payments")
    .select("athletes(groups!group_id(branch, head_coach_id))")
    .eq("id", paymentId)
    .maybeSingle();
  const group = (payment as any)?.athletes?.groups;
  if (group) {
    if (group.head_coach_id) recipients.add(group.head_coach_id);
    if (group.branch) {
      const { data: branchRow } = await supabase
        .from("branches")
        .select("coordinator_user_id")
        .eq("name", group.branch)
        .maybeSingle();
      if (branchRow?.coordinator_user_id) recipients.add(branchRow.coordinator_user_id);
    }
  }

  const methodLabel = PAYMENT_METHOD_LABEL[method];
  const title = "Ödeme Bildirimi";
  const body =
    `${athleteName} için ${amount.toLocaleString("tr-TR")} ₺ tutarındaki aidatın ${methodLabel} ile ödendiği bildirildi` +
    (hasReceipt ? " (dekont eklendi)" : "") +
    " — kontrol edip onaylayabilirsiniz.";

  await Promise.all(
    Array.from(recipients).map((id) => sendNotification(id, title, body, "payment_claim").catch(() => {}))
  );
}

// "Ödedim, Bildir" akışında isteğe bağlı dekont/makbuz fotoğrafı — bucket
// private, herkese açık URL yerine ~10 yıllık imzalı URL kullanılıyor
// (bkz. sessionMedia.ts'teki aynı desen).
export async function uploadPaymentReceipt(paymentId: string, localUri: string): Promise<string> {
  const fileExt = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${paymentId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(path, arrayBuffer, { contentType });
  if (uploadError) throw uploadError;

  const { data: signedData, error: signError } = await supabase.storage
    .from("payment-receipts")
    .createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  return signedData.signedUrl;
}

// payments tablosunda velinin doğrudan UPDATE izni yok (amount/status gibi
// hassas kolonları da değiştirebilir hale gelmesin diye) — bu yüzden
// SADECE receipt_url'i, SADECE kendi sporcusunun ödemesinde değiştiren dar
// bir RPC üzerinden yapılıyor (bkz. migration 20260906220000).
export async function submitPaymentReceipt(paymentId: string, receiptUrl: string): Promise<void> {
  const { error } = await supabase.rpc("submit_payment_receipt", {
    p_payment_id: paymentId,
    p_receipt_url: receiptUrl,
  });
  if (error) throw error;
}

// Veli "Ödedim, Bildir" derken hangi yöntemi seçtiğini kaydeder — admin
// Finans ekranında "Bekliyor" satırının altında "Veli Elden/Havale ile
// ödediğini bildirdi" gösterebilmek için (bkz. migration 20260907030000).
export async function claimPaymentMethod(paymentId: string, method: PaymentClaimMethod): Promise<void> {
  const { error } = await supabase.rpc("claim_payment_method", {
    p_payment_id: paymentId,
    p_method: method,
  });
  if (error) throw error;
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
