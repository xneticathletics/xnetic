import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
import { sendNotification } from "./notifications";

export type AnnouncementTarget = "club" | "group" | "athletes" | "parents" | "coaches";

export type Announcement = {
  id: string;
  target_types: AnnouncementTarget[];
  target_ids: string[] | null;
  title: string;
  body: string;
  created_at: string;
  attachment_url: string | null;
};

export type AnnouncementInput = {
  target_types: AnnouncementTarget[];
  target_ids: string[] | null;
  title: string;
  body: string;
  attachment_url?: string | null;
};

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, target_types, target_ids, title, body, created_at, attachment_url")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Duyuru eki: fotoğraf/video/belge — max 1 MB (bkz. migration
// 20260905050000_announcement_attachments.sql'deki bucket sınırı, mobildeki
// src/lib/api/announcements.ts ile birebir aynı sınır).
export const MAX_ATTACHMENT_SIZE_BYTES = 1 * 1024 * 1024;

export async function uploadAnnouncementAttachment(file: File, clubId: string): Promise<string> {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error(`Dosya en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
  }
  const ext = file.name.split(".").pop() || "bin";
  const path = `${clubId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("announcement-attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  const { data } = supabase.storage.from("announcement-attachments").getPublicUrl(path);
  return data.publicUrl;
}

// Duyuru hedeflerine (target_types/target_ids) göre gerçek alıcı kullanıcı
// id'lerini çözer. Duyuruyu oluşturan kendine bildirim almaz. Mobildeki
// src/lib/api/announcements.ts ile birebir aynı.
async function resolveAnnouncementRecipients(announcement: Announcement): Promise<string[]> {
  const myUserId = await getCurrentAppUserId();
  const recipients = new Set<string>();

  for (const t of announcement.target_types) {
    if (t === "club") {
      const { data } = await supabase.from("users").select("id").eq("is_active", true);
      (data ?? []).forEach((u) => recipients.add(u.id));
    } else if (t === "parents" || t === "coaches" || t === "athletes") {
      const role = t === "parents" ? "parent" : t === "coaches" ? "coach" : "athlete";
      const { data } = await supabase.from("users").select("id").eq("role", role).eq("is_active", true);
      (data ?? []).forEach((u) => recipients.add(u.id));
    } else if (t === "group" && announcement.target_ids?.length) {
      const groupIds = announcement.target_ids;
      const [athletesResult, extraLinksResult, groupsResult, coachesResult] = await Promise.all([
        supabase.from("athletes").select("parent_user_id, athlete_user_id").in("group_id", groupIds).eq("status", "active"),
        supabase.from("athlete_groups").select("athlete_id").in("group_id", groupIds),
        supabase.from("groups").select("head_coach_id").in("id", groupIds),
        supabase.from("group_coaches").select("coach_id").in("group_id", groupIds),
      ]);
      (athletesResult.data ?? []).forEach((a) => {
        if (a.parent_user_id) recipients.add(a.parent_user_id);
        if (a.athlete_user_id) recipients.add(a.athlete_user_id);
      });
      const extraAthleteIds = (extraLinksResult.data ?? []).map((r) => r.athlete_id);
      if (extraAthleteIds.length > 0) {
        const { data: extraAthletes } = await supabase
          .from("athletes")
          .select("parent_user_id, athlete_user_id")
          .in("id", extraAthleteIds)
          .eq("status", "active");
        (extraAthletes ?? []).forEach((a) => {
          if (a.parent_user_id) recipients.add(a.parent_user_id);
          if (a.athlete_user_id) recipients.add(a.athlete_user_id);
        });
      }
      (groupsResult.data ?? []).forEach((g) => {
        if (g.head_coach_id) recipients.add(g.head_coach_id);
      });
      (coachesResult.data ?? []).forEach((c) => recipients.add(c.coach_id));
    }
  }

  if (myUserId) recipients.delete(myUserId);
  return Array.from(recipients);
}

async function notifyAnnouncementRecipients(announcement: Announcement) {
  const recipientIds = await resolveAnnouncementRecipients(announcement);
  if (recipientIds.length === 0) return;
  const title = "📣 Yeni Duyuru";
  await Promise.all(recipientIds.map((uid) => sendNotification(uid, title, announcement.title, "announcement").catch(() => {})));
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { data, error } = await supabase.from("announcements").insert(input).select().single();
  if (error) throw error;
  await notifyAnnouncementRecipients(data as Announcement).catch(() => {});
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
