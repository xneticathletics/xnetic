import { supabase } from "../supabase";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

// Admin, web panel Kullanıcılar sayfasından bir kişinin hangi bildirim
// türlerini almayacağını (users.muted_notification_types) yönetebiliyor —
// bu liste hem burada hem webdeki web/src/lib/api/notifications.ts'te
// birebir aynı key/label çiftleriyle tutulur (ayrı dosyalar, ortak sabit
// paylaşılamıyor). Yeni bir sendNotification çağrı noktası eklerken buraya
// da (ve web'e de) karşılık gelen bir key eklenmeli.
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
// oluşturulmaz. Webdeki web/src/lib/api/notifications.ts ile birebir aynı.
export async function sendNotification(recipientUserId: string, title: string, body: string, eventType?: NotificationEventType) {
  if (eventType) {
    const { data, error: checkError } = await supabase
      .from("users")
      .select("muted_notification_types")
      .eq("id", recipientUserId)
      .maybeSingle();
    if (!checkError && data?.muted_notification_types?.includes(eventType)) return;
  }

  const { data: inserted, error } = await supabase
    .from("notifications")
    .insert({ recipient_user_id: recipientUserId, title, body, event_type: eventType ?? null })
    .select("id")
    .single();
  if (error) throw error;

  triggerPushNotification(inserted.id);
}

// Push gönderimi best-effort: başarısız olsa da uygulama-içi bildirim akışını
// bloklamamalı/hataya düşürmemeli, bu yüzden await edilmiyor ve hatası yutuluyor.
function triggerPushNotification(notificationId: string) {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
  fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ notification_id: notificationId }),
  }).catch(() => {});
}

export async function listMyNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getMyUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// Şifre sıfırlama talepleri (event_type: "password_reset_request") kasıtlı
// olarak buradan MUAF — Kullanıcılar ekranı bunları "okunmadı/bekliyor"
// bilgisine göre üstte gösteriyor; zile dokunmak "gördüm" anlamına
// gelmemeli, sadece admin gerçekten şifreyi sıfırlayınca çözülmüş sayılır
// (bkz. UsersListScreen.tsx handleReset → markNotificationRead).
export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .or("event_type.is.null,event_type.neq.password_reset_request");
  if (error) throw error;
}

export type PendingPasswordResetRequest = { notificationId: string; requesterId: string };

// Kulüp Ayarları → Kullanıcılar ekranında, henüz cevaplanmamış (okunmamış)
// şifre sıfırlama taleplerini üstte göstermek için — request-password-
// reset-notice edge function'ının payload'a yazdığı requesterId'yi okur.
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
