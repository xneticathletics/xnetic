import { supabase } from "../supabase";

// Mobildeki src/lib/api/notifications.ts ile aynı insert — fitness
// programı yayınlandığında gruptaki ilgililere bildirim göndermek için
// (bkz. lib/api/fitnessPrograms.ts notifyProgramPublished).
export async function sendNotification(recipientUserId: string, title: string, body: string) {
  const { error } = await supabase.from("notifications").insert({
    recipient_user_id: recipientUserId,
    title,
    body,
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
