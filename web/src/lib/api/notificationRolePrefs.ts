import { supabase } from "../supabase";
import type { NotificationEventType } from "./notifications";

// Kişi kişi bildirim tercihi değiştirmek yerine, admin tek seferde bir ROL
// için ayarlar — o rolün TÜM üyelerinin muted_notification_types'ı bu
// değerle EZİLEREK güncellenir (bkz. applyRoleNotificationPrefs). Antrenör
// rolü ikiye ayrılıyor: bir branşın koordinatörü olan antrenörler ile
// olmayanlar — coordinator olup olmama bilgisi branches.coordinator_user_id
// kolonundan çıkarılıyor (users tablosunda ayrı bir kolon yok).
export type RoleBucket = "club_admin" | "coordinator" | "coach" | "athlete" | "parent";

export const ROLE_BUCKETS: { key: RoleBucket; label: string }[] = [
  { key: "club_admin", label: "Admin" },
  { key: "coordinator", label: "Koordinatör Antrenör" },
  { key: "coach", label: "Antrenör" },
  { key: "athlete", label: "Sporcu" },
  { key: "parent", label: "Veli" },
];

async function getCoordinatorUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("branches").select("coordinator_user_id").not("coordinator_user_id", "is", null);
  if (error) throw error;
  return new Set((data ?? []).map((b) => b.coordinator_user_id as string));
}

export async function getUserIdsForRoleBucket(bucket: RoleBucket): Promise<string[]> {
  if (bucket === "club_admin") {
    const { data, error } = await supabase.from("users").select("id").eq("role", "club_admin").eq("is_active", true);
    if (error) throw error;
    return (data ?? []).map((u) => u.id);
  }

  if (bucket === "coordinator" || bucket === "coach") {
    const [{ data: coaches, error }, coordinatorIds] = await Promise.all([
      supabase.from("users").select("id").eq("role", "coach").eq("is_active", true),
      getCoordinatorUserIds(),
    ]);
    if (error) throw error;
    return (coaches ?? [])
      .map((u) => u.id as string)
      .filter((id) => (bucket === "coordinator" ? coordinatorIds.has(id) : !coordinatorIds.has(id)));
  }

  const role = bucket === "athlete" ? "athlete" : "parent";
  const { data, error } = await supabase.from("users").select("id").eq("role", role).eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map((u) => u.id);
}

// O roldeki üyelerin güncel susturma durumunun BİRLEŞİMİni (union) döner —
// bir tür, üyelerden en az biri tarafından susturulmuşsa "susturulmuş"
// gösterilir. Sadece ekranı ilk açarken makul bir başlangıç durumu vermek
// için — Kaydet'e basınca bu ekrandaki değerler TÜM üyelere uygulanır.
export async function getRoleNotificationPrefs(bucket: RoleBucket): Promise<{ muted: string[]; memberCount: number }> {
  const ids = await getUserIdsForRoleBucket(bucket);
  if (ids.length === 0) return { muted: [], memberCount: 0 };
  const { data, error } = await supabase.from("users").select("muted_notification_types").in("id", ids);
  if (error) throw error;
  const muted = new Set<string>();
  (data ?? []).forEach((u) => (u.muted_notification_types ?? []).forEach((t: string) => muted.add(t)));
  return { muted: Array.from(muted), memberCount: ids.length };
}

// Verilen susturma listesini, o roldeki HERKESİN muted_notification_types'ına
// yazar — kişi bazlı farklılıkları eziyor (kasıtlı: "ana rolün bildirimlerini
// değiştirince o roldeki herkesin bildirim tercihleri değişsin").
export async function applyRoleNotificationPrefs(bucket: RoleBucket, mutedTypes: NotificationEventType[]): Promise<number> {
  const ids = await getUserIdsForRoleBucket(bucket);
  if (ids.length === 0) return 0;
  const { error } = await supabase.from("users").update({ muted_notification_types: mutedTypes }).in("id", ids);
  if (error) throw error;
  return ids.length;
}
