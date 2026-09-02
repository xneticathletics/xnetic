import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";

export type AnnouncementTarget = "club" | "group" | "athletes" | "parents" | "coaches";

export type Announcement = {
  id: string;
  target_types: AnnouncementTarget[];
  target_ids: string[] | null;
  title: string;
  body: string;
  created_at: string;
};

export type AnnouncementInput = {
  target_types: AnnouncementTarget[];
  target_ids: string[] | null;
  title: string;
  body: string;
};

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, target_types, target_ids, title, body, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { data, error } = await supabase.from("announcements").insert(input).select().single();
  if (error) throw error;
  return data;
}

// Duyuruların hedef kitlesine göre görünürlüğünü istemci tarafında uygular.
// Kulüp Admini / Süper Admin yönetim amaçlı her şeyi görür; diğer roller
// yalnızca kendilerini ilgilendiren duyuruları görür.
export function filterAnnouncementsForViewer(
  items: Announcement[],
  role: string,
  myGroupIds: string[]
): Announcement[] {
  if (role === "club_admin" || role === "super_admin") return items;

  return items.filter((a) =>
    a.target_types.some((t) => {
      if (t === "club") return true;
      if (t === "parents") return role === "parent";
      if (t === "coaches") return role === "coach";
      if (t === "athletes") return role === "athlete";
      if (t === "group") return (a.target_ids ?? []).some((id) => myGroupIds.includes(id));
      return false;
    })
  );
}

// ---------------------------------------------------------------- OKUNDU TAKİBİ

export async function markAnnouncementRead(announcementId: string) {
  const userId = await getCurrentAppUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("announcement_reads")
    .upsert({ announcement_id: announcementId, user_id: userId }, { onConflict: "announcement_id,user_id" });
  if (error) throw error;
}

export async function hasIRead(announcementId: string): Promise<boolean> {
  const userId = await getCurrentAppUserId();
  if (!userId) return false;
  const { data, error } = await supabase
    .from("announcement_reads")
    .select("id")
    .eq("announcement_id", announcementId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export type AnnouncementReader = {
  user_id: string;
  name: string;
  read_at: string;
};

export async function getAnnouncementReaders(announcementId: string): Promise<AnnouncementReader[]> {
  const { data, error } = await supabase
    .from("announcement_reads")
    .select("user_id, read_at, users(name)")
    .eq("announcement_id", announcementId)
    .order("read_at", { ascending: true });
  if (error) throw error;
  return ((data as any[]) ?? []).map((r) => ({
    user_id: r.user_id,
    name: r.users?.name ?? "—",
    read_at: r.read_at,
  }));
}
