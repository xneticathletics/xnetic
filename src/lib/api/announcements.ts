import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
import { sendNotification } from "./notifications";

export type AnnouncementTarget = "club" | "group" | "athletes" | "parents" | "coaches";

export type Announcement = {
  id: string;
  target_types: AnnouncementTarget[];
  target_ids: string[] | null;
  // "group" hedefi için — hangi antrenör/sporcu/veli isimlerinin
  // işaretlendiği (bkz. getGroupRecipientOptions). NULL/boş: eski
  // duyurular ya da hiç daraltılmamış — gruptaki HERKESE gider.
  target_user_ids: string[] | null;
  title: string;
  body: string;
  created_at: string;
  attachment_url: string | null;
  storage_path: string | null;
};

export type AnnouncementInput = {
  target_types: AnnouncementTarget[];
  target_ids: string[] | null;
  target_user_ids?: string[] | null;
  title: string;
  body: string;
  attachment_url?: string | null;
  storage_path?: string | null;
};

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, target_types, target_ids, target_user_ids, title, body, created_at, attachment_url, storage_path")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Tek bir duyuruyu getirir — AnnouncementDetailScreen'in, sadece bir tanesini
// göstermek için TÜM kulübün duyuru listesini indirip client-side .find()
// yaptığı eski deseni değiştiriyor (duyuru sayısı arttıkça her detay
// ekranı açılışında gereksiz büyüyen bir indirme oluyordu).
export async function getAnnouncement(id: string): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, target_types, target_ids, target_user_ids, title, body, created_at, attachment_url, storage_path")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// Duyuru eki: fotoğraf/video/belge — max 1 MB (bkz. migration
// 20260905050000_announcement_attachments.sql'deki bucket sınırı, ikisi
// senkron tutulmalı). Kulübe özel bir yolda tutulur ("<clubId>/<dosya>").
export const MAX_ATTACHMENT_SIZE_BYTES = 1 * 1024 * 1024;

export async function uploadAnnouncementAttachment(
  localUri: string,
  clubId: string,
  fileName: string,
  mimeType: string | null
): Promise<{ url: string; path: string }> {
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists && info.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error(`Dosya en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
  }

  const ext = fileName.split(".").pop()?.split("?")[0] || "bin";
  const path = `${clubId}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("announcement-attachments")
    .upload(path, arrayBuffer, { contentType: mimeType ?? "application/octet-stream" });
  if (error) throw error;

  const { data } = supabase.storage.from("announcement-attachments").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// Duyuru hedeflerine (target_types/target_ids) göre gerçek alıcı kullanıcı
// id'lerini çözer — filterAnnouncementsForViewer'ın "görüntüleyen kim
// görebilir" mantığının tersi: "bu duyuruyu kimlere göndermeliyiz".
// Duyuruyu oluşturan kendine bildirim almaz.
async function resolveAnnouncementRecipients(announcement: Announcement): Promise<string[]> {
  const myUserId = await getCurrentAppUserId();
  const recipients = new Set<string>();

  for (const t of announcement.target_types) {
    if (t === "club") {
      // Süper admin hiçbir kulübün duyurusuyla ilgilenmez — sadece kulüp
      // adminlerine duyuru GÖNDEREBİLİR (bkz. AdminAnnounceScreen), asla
      // bir kulübün "Tüm Kulüp" duyurusunu ALMAZ.
      const { data } = await supabase.from("users").select("id").eq("is_active", true).neq("role", "super_admin");
      (data ?? []).forEach((u) => recipients.add(u.id));
    } else if (t === "parents" || t === "athletes") {
      // Artık yeni duyurularda üretilmiyor (bkz. AnnouncementFormScreen —
      // "Veliler"/"Sporcular" kulüp geneli seçenek olmaktan çıktı), ama eski
      // duyurular hâlâ bu target_type'ları taşıyabilir.
      const role = t === "parents" ? "parent" : "athlete";
      const { data } = await supabase.from("users").select("id").eq("role", role).eq("is_active", true);
      (data ?? []).forEach((u) => recipients.add(u.id));
    } else if (t === "coaches") {
      // target_user_ids doluysa admin branş seçip antrenörleri isim isim
      // işaretlemiş demektir (bkz. AnnouncementFormScreen) — sadece onlara
      // gidiyor. NULL ise eski duyurular: TÜM antrenörlere gider.
      if (announcement.target_user_ids?.length) {
        announcement.target_user_ids.forEach((id) => recipients.add(id));
      } else {
        const { data } = await supabase.from("users").select("id").eq("role", "coach").eq("is_active", true);
        (data ?? []).forEach((u) => recipients.add(u.id));
      }
    } else if (t === "group" && announcement.target_ids?.length) {
      // target_user_ids doluysa admin, grup(lar) için antrenör/sporcu/veli
      // isimlerini TEK TEK (ya da rol bazında "Tümü") daraltmış demektir —
      // o zaman SADECE onlara gidiyor. Boş/NULL ise (eski duyurular ya da
      // hiç daraltılmamış) eski davranış: gruptaki HERKESE gider.
      if (announcement.target_user_ids?.length) {
        announcement.target_user_ids.forEach((id) => recipients.add(id));
      } else {
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
  }

  if (myUserId) recipients.delete(myUserId);
  return Array.from(recipients);
}

export type GroupAnnouncementRecipients = {
  athletes: string[];
  parents: string[];
};

// "Branşlar" hedefinde bir grup işaretlenince, gerçek alıcı kullanıcı
// id'lerini (sporcu hesabı + istenirse veli hesabı) çözer — sadece
// GERÇEKTEN bir hesabı olanlar sayılır: hesabı olmayan bir sporcu kendi
// adına bildirim alamaz (bildirim gidecek hesap velisininkidir).
export async function getGroupAnnouncementRecipients(groupId: string): Promise<GroupAnnouncementRecipients> {
  const [athletesResult, extraLinksResult] = await Promise.all([
    supabase
      .from("athletes")
      .select("athlete_user_id, parent_user_id")
      .eq("group_id", groupId)
      .eq("status", "active"),
    supabase.from("athlete_groups").select("athlete_id").eq("group_id", groupId),
  ]);
  if (athletesResult.error) throw athletesResult.error;
  if (extraLinksResult.error) throw extraLinksResult.error;

  let athleteRows = athletesResult.data ?? [];
  const extraAthleteIds = (extraLinksResult.data ?? []).map((r) => r.athlete_id);
  if (extraAthleteIds.length > 0) {
    const { data: extraAthletes, error } = await supabase
      .from("athletes")
      .select("athlete_user_id, parent_user_id")
      .in("id", extraAthleteIds)
      .eq("status", "active");
    if (error) throw error;
    athleteRows = [...athleteRows, ...(extraAthletes ?? [])];
  }

  const athletes = new Set<string>();
  const parents = new Set<string>();
  athleteRows.forEach((a) => {
    if (a.athlete_user_id) athletes.add(a.athlete_user_id);
    if (a.parent_user_id) parents.add(a.parent_user_id);
  });

  return { athletes: Array.from(athletes), parents: Array.from(parents) };
}

async function notifyAnnouncementRecipients(announcement: Announcement) {
  const recipientIds = await resolveAnnouncementRecipients(announcement);
  if (recipientIds.length === 0) return;
  const title = "📣 Yeni Duyuru";
  await Promise.all(
    recipientIds.map((uid) =>
      sendNotification(uid, title, announcement.title, "announcement", { announcementId: announcement.id }).catch(() => {})
    )
  );
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { data, error } = await supabase.from("announcements").insert(input).select().single();
  if (error) throw error;
  await notifyAnnouncementRecipients(data as Announcement).catch(() => {});
  return data;
}

// Silme, announcement_reads içindeki BAŞKA kullanıcılara ait okundu
// kayıtlarını da temizlemesi gerektiğinden (RLS bunu düz bir delete'e
// izin vermez — bkz. announcement_reads_own_delete) SECURITY DEFINER bir
// RPC üzerinden yapılıyor (bkz. migration 20260915100000). Ek dosya varsa
// veritabanı kaydı silindikten SONRA, best-effort olarak storage'dan da
// kaldırılır — storage silme başarısız olsa bile duyuru zaten gitmiş olur,
// geride yetim bir dosya kalması kullanıcı için görünür bir soruna yol açmaz.
export async function deleteAnnouncement(announcement: Pick<Announcement, "id" | "storage_path">) {
  const { error } = await supabase.rpc("delete_announcement", { p_announcement_id: announcement.id });
  if (error) throw error;
  if (announcement.storage_path) {
    await supabase.storage.from("announcement-attachments").remove([announcement.storage_path]).catch(() => {});
  }
}

// Duyuruların hedef kitlesine göre görünürlüğünü istemci tarafında uygular.
// Kulüp Admini / Süper Admin yönetim amaçlı her şeyi görür; diğer roller
// yalnızca kendilerini ilgilendiren duyuruları görür. myUserId, "group"
// hedefinde admin belirli isimler seçmişse (target_user_ids) kendisinin
// o listede olup olmadığını kontrol etmek için gerekiyor.
export function filterAnnouncementsForViewer(
  items: Announcement[],
  role: string,
  myGroupIds: string[],
  myUserId?: string | null
): Announcement[] {
  if (role === "club_admin" || role === "super_admin") return items;

  return items.filter((a) =>
    a.target_types.some((t) => {
      if (t === "club") return true;
      if (t === "parents") return role === "parent";
      if (t === "athletes") return role === "athlete";
      if (t === "coaches") {
        if (role !== "coach") return false;
        // Admin branş seçip antrenörleri isim isim işaretlemiş olabilir
        // (bkz. AnnouncementFormScreen) — öyleyse sadece o listedeysem
        // görürüm. NULL ise eski duyurular: tüm antrenörler görür.
        if (a.target_user_ids?.length) return !!myUserId && a.target_user_ids.includes(myUserId);
        return true;
      }
      if (t === "group") {
        if (!(a.target_ids ?? []).some((id) => myGroupIds.includes(id))) return false;
        // Grup eşleşti — ama admin isim isim daraltmış olabilir; öyleyse
        // sadece o listedeysem görürüm.
        if (a.target_user_ids?.length) return !!myUserId && a.target_user_ids.includes(myUserId);
        return true;
      }
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

export type AnnouncementTargetDetails = {
  groupNames: string[];
  // "group" ve/veya "coaches" hedefinde admin isim isim daraltmışsa (bkz.
  // AnnouncementFormScreen) çözülen gerçek alıcı isimleri — duyuruyu
  // oluşturan kişi "bunu kime gönderdim" diye görebilsin diye.
  recipientNames: string[];
};

// Duyuru detayında "Kime Gönderildi" bölümü için — kategori etiketlerinin
// (target_types) ötesinde, gerçekten hangi gruplara/kişilere gittiğini
// isimleriyle çözer.
export async function getAnnouncementTargetDetails(announcement: Announcement): Promise<AnnouncementTargetDetails> {
  const [groupsResult, usersResult] = await Promise.all([
    announcement.target_ids?.length
      ? supabase.from("groups").select("name").in("id", announcement.target_ids)
      : Promise.resolve({ data: [] as { name: string }[], error: null }),
    announcement.target_user_ids?.length
      ? supabase.from("users").select("name").in("id", announcement.target_user_ids)
      : Promise.resolve({ data: [] as { name: string }[], error: null }),
  ]);
  if (groupsResult.error) throw groupsResult.error;
  if (usersResult.error) throw usersResult.error;
  return {
    groupNames: (groupsResult.data ?? []).map((g) => g.name).sort((a, b) => a.localeCompare(b, "tr")),
    recipientNames: (usersResult.data ?? []).map((u) => u.name).sort((a, b) => a.localeCompare(b, "tr")),
  };
}
