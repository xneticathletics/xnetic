import { supabase } from "../supabase";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export async function sendNotification(recipientUserId: string, title: string, body: string) {
  const { error } = await supabase.from("notifications").insert({
    recipient_user_id: recipientUserId,
    title,
    body,
  });
  if (error) throw error;
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
