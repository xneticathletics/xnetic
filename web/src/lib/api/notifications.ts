import { supabase } from "../supabase";

// Admin, Kullanıcılar sayfasından bir kişinin hangi bildirim türlerini
// almayacağını (users.muted_notification_types) yönetebiliyor — bu liste
// hem burada hem mobildeki src/lib/api/notifications.ts'te birebir aynı
// key/label çiftleriyle tutulur (ayrı dosyalar, ortak sabit paylaşılamıyor).
// Yeni bir sendNotification çağrı noktası eklerken buraya da (ve mobile de)
// karşılık gelen bir key eklenmeli.
export type NotificationEventType =
  | "match_result"
  | "absence"
  | "consecutive_absence"
  | "fitness_program"
  | "membership_freeze"
  | "session_excuse"
  | "payment_claim"
  | "payment_reminder"
  | "announcement";

export const NOTIFICATION_EVENT_TYPES: { key: NotificationEventType; label: string }[] = [
  { key: "match_result", label: "Maç Sonucu" },
  { key: "absence", label: "Antrenmana Katılmama" },
  { key: "consecutive_absence", label: "Devamsızlık Uyarısı" },
  { key: "fitness_program", label: "Yeni Fitness Programı" },
  { key: "membership_freeze", label: "Kayıt Dondurma" },
  { key: "session_excuse", label: "Antrenmana Katılamayacak Bildirimi" },
  { key: "payment_claim", label: "Ödeme Bildirimi (Admin'e)" },
  { key: "payment_reminder", label: "Aidat Hatırlatması" },
  { key: "announcement", label: "Yeni Duyuru" },
];

// event_type verilmezse (ör. süper admin duyurusu gibi kategorisiz
// gönderimler) hiçbir susturma kontrolünden geçmez — sadece aşağıdaki 8
// kategoriden biri verildiğinde alıcı, o türü susturmuşsa bildirim hiç
// oluşturulmaz. Mobildeki src/lib/api/notifications.ts ile birebir aynı.
export async function sendNotification(recipientUserId: string, title: string, body: string, eventType?: NotificationEventType) {
  if (eventType) {
    const { data, error: checkError } = await supabase
      .from("users")
      .select("muted_notification_types")
      .eq("id", recipientUserId)
      .maybeSingle();
    if (!checkError && data?.muted_notification_types?.includes(eventType)) return;
  }

  const { error } = await supabase.from("notifications").insert({
    recipient_user_id: recipientUserId,
    title,
    body,
    event_type: eventType ?? null,
  });
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export type PendingPasswordResetRequest = { notificationId: string; requesterId: string };

// Kullanıcılar sayfasında, henüz cevaplanmamış (okunmamış) şifre
// sıfırlama taleplerini üstte göstermek için — mobildeki notifications.ts
// ile birebir aynı sorgu.
export async function listPendingPasswordResetRequests(): Promise<PendingPasswordResetRequest[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, payload")
    .eq("event_type", "password_reset_request")
    .is("read_at", null);
  if (error) throw error;
  return ((data as any[]) ?? [])
    .filter((n) => n.payload?.requesterId)
    .map((n) => ({ notificationId: n.id, requesterId: n.payload.requesterId as string }));
}
