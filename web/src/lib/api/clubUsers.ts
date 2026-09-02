import { supabase } from "../supabase";
import type { UserRole } from "../../context/AuthContext";

export type ClubUser = {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  muted_notification_types: string[];
};

// Kulüp Ayarları → Kullanıcılar sayfası için — kendi kulübündeki tüm
// (aktif) hesapları listeler. RLS zaten club_admin'i kendi kulübüyle
// sınırlıyor, bu yüzden burada manuel club_id filtresine gerek yok
// (mobildeki clubUsers.ts ile birebir aynı).
export async function listClubUsers(): Promise<ClubUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, phone, muted_notification_types")
    .eq("is_active", true)
    .order("role")
    .order("name");
  if (error) throw error;
  return ((data as any[]) ?? []).map((u) => ({ ...u, muted_notification_types: u.muted_notification_types ?? [] })) as ClubUser[];
}

// Admin'in, bu kişinin hangi bildirim türlerini ALMAYACAĞINI belirlemesi
// için — bkz. lib/api/notifications.ts NOTIFICATION_EVENT_TYPES.
export async function updateMutedNotificationTypes(userId: string, mutedTypes: string[]) {
  const { error } = await supabase.from("users").update({ muted_notification_types: mutedTypes }).eq("id", userId);
  if (error) throw error;
}
