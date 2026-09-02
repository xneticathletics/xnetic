import { supabase } from "../supabase";

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

export type AnnouncementReader = { user_id: string; name: string; read_at: string };

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
