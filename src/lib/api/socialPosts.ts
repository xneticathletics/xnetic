import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { getCurrentAppUserId, getCurrentClubId } from "./currentUser";
import { sendNotification } from "./notifications";
import type { UserRole } from "../../context/AuthContext";

// "social-posts" bucket'ında da bu değerle senkron (bkz. migration
// 20260909050000_social_posts.sql'deki bucket file_size_limit).
export const MAX_SOCIAL_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

export type SocialPost = {
  id: string;
  club_id: string;
  branch: string;
  author_id: string;
  author_name?: string;
  media_type: "photo" | "video";
  media_url: string;
  storage_path: string;
  caption: string | null;
  status: "pending" | "approved";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

async function attachAuthorNames(posts: SocialPost[]): Promise<SocialPost[]> {
  if (posts.length === 0) return posts;
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const { data: authors } = await supabase.from("users").select("id, name").in("id", authorIds);
  const nameById = new Map((authors ?? []).map((a) => [a.id, a.name as string]));
  return posts.map((p) => ({ ...p, author_name: nameById.get(p.author_id) ?? "—" }));
}

// Branşlarımdaki ONAYLI paylaşımlar + KENDİ bekleyen paylaşımlarım —
// böylece bir sporcu/veli kendi az önce yüklediği fotoğrafı hemen akışta
// (pasif/"onay bekliyor" görünümüyle) görebiliyor, tamamen kaybolmuyor.
// Başka birinin bekleyen paylaşımı (moderatöre görünen) buraya KARIŞMIYOR
// — o sadece "Onay Bekleyenler" sekmesinde kalıyor (author_id filtresiyle
// sadece kendiminkini çekiyoruz).
export async function listSocialFeed(): Promise<SocialPost[]> {
  const myUserId = await getCurrentAppUserId();
  const [approvedResult, ownPendingResult] = await Promise.all([
    supabase.from("social_posts").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    myUserId
      ? supabase.from("social_posts").select("*").eq("status", "pending").eq("author_id", myUserId)
      : Promise.resolve({ data: [] as SocialPost[], error: null }),
  ]);
  if (approvedResult.error) throw approvedResult.error;
  if (ownPendingResult.error) throw ownPendingResult.error;
  const merged = [...(ownPendingResult.data ?? []), ...(approvedResult.data ?? [])] as SocialPost[];
  merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return attachAuthorNames(merged);
}

// "Onay Bekleyenler" sekmesi rozetindeki sayı için — hafif bir count
// sorgusu, tüm bekleyen satırları çekmeden.
export async function getPendingSocialPostCount(): Promise<number> {
  const { count, error } = await supabase
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// Branşımı modere edebildiğim (antrenör/koordinatör/admin) bekleyen
// paylaşımlar — RLS is_branch_moderator ile filtreliyor. NOT: RLS bunu
// yazarın kendi bekleyen paylaşımı için de true döner, bu yüzden ekranda
// "Onay Bekleyenler" sekmesi role === 'coach' | 'club_admin' ile gate'lenmeli.
export async function listPendingSocialPosts(): Promise<SocialPost[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachAuthorNames(data ?? []);
}

// "Yeni Paylaşım" ekranındaki branş seçici için — admin tüm branşları,
// diğerleri kendi bağlı oldukları branşları görür (is_my_branch'in
// client-side eşleniği, getMyCoachedGroupIds/getMyBranchGroupIds tarzı).
export async function listMyBranches(role: UserRole | null): Promise<string[]> {
  if (role === "club_admin") {
    const { data, error } = await supabase.from("branches").select("name").order("name");
    if (error) throw error;
    return (data ?? []).map((b) => b.name);
  }

  const userId = await getCurrentAppUserId();
  if (!userId) return [];

  // "groups!group_id": athletes/group_coaches ile groups arasında birden
  // fazla ilişki var (athlete_groups köprü tablosu da groups'a bağlı) —
  // FK'yi açıkça belirtmezsek PostgREST embed'i belirsiz sayıp sessizce
  // boş/yanlış dönebiliyor (bkz. athletes.ts/fitnessGroups.ts/payments.ts'de
  // zaten uygulanan aynı düzeltme). Bu olmadan, sadece kendi sporcu kaydı
  // üzerinden branşı bulunan bir sporcu/veli "Bağlı olduğun bir branş
  // bulunamadı" hatası alıyordu.
  const [athleteRows, headGroups, assistantGroups, coachBranches, coordBranches] = await Promise.all([
    supabase.from("athletes").select("groups!group_id(branch)").or(`parent_user_id.eq.${userId},athlete_user_id.eq.${userId}`),
    supabase.from("groups").select("branch").eq("head_coach_id", userId),
    supabase.from("group_coaches").select("groups!group_id(branch)").eq("coach_id", userId),
    supabase.from("coach_branches").select("branches(name)").eq("coach_id", userId),
    supabase.from("branches").select("name").eq("coordinator_user_id", userId),
  ]);

  const names = new Set<string>();
  (athleteRows.data ?? []).forEach((r: any) => r.groups?.branch && names.add(r.groups.branch));
  (headGroups.data ?? []).forEach((g) => g.branch && names.add(g.branch));
  (assistantGroups.data ?? []).forEach((r: any) => r.groups?.branch && names.add(r.groups.branch));
  (coachBranches.data ?? []).forEach((r: any) => r.branches?.name && names.add(r.branches.name));
  (coordBranches.data ?? []).forEach((b) => names.add(b.name));

  return Array.from(names);
}

// Galeriden seçilen fotoğrafı/videoyu "social-posts" bucket'ına yükler,
// sonra social_posts satırını oluşturur. Durum (pending/approved) sunucu
// tarafında trigger ile hesaplanıyor, burada gönderilmiyor bile.
export async function createSocialPost(params: {
  branch: string;
  localUri: string;
  mediaType: "photo" | "video";
  caption?: string;
}): Promise<SocialPost> {
  const userId = await getCurrentAppUserId();
  const clubId = await getCurrentClubId();
  if (!userId || !clubId) throw new Error("Kullanıcı bulunamadı");

  if (params.mediaType === "video") {
    const info = await FileSystem.getInfoAsync(params.localUri);
    if (info.exists && info.size > MAX_SOCIAL_VIDEO_SIZE_BYTES) {
      throw new Error(`Video en fazla ${MAX_SOCIAL_VIDEO_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
    }
  }

  const ext = params.localUri.split(".").pop()?.split("?")[0] || (params.mediaType === "video" ? "mp4" : "jpg");
  const path = `${clubId}/${userId}/${Date.now()}.${ext}`;
  const contentType =
    params.mediaType === "video"
      ? `video/${ext === "mov" ? "quicktime" : ext}`
      : ext === "jpg"
        ? "image/jpeg"
        : `image/${ext}`;

  const base64 = await FileSystem.readAsStringAsync(params.localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("social-posts")
    .upload(path, arrayBuffer, { contentType });
  if (uploadError) throw uploadError;

  // Bucket private — herkese açık URL yerine ~10 yıllık imzalı URL.
  const { data: signedData, error: signError } = await supabase.storage.from("social-posts").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  // author_id = kendi satırım olduğu için .select() zincirlemek güvenli —
  // sendNotification'daki alıcı≠gönderen RLS bug'ıyla karıştırılmasın.
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      club_id: clubId,
      branch: params.branch,
      author_id: userId,
      media_type: params.mediaType,
      media_url: signedData.signedUrl,
      storage_path: path,
      caption: params.caption ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  const post = data as SocialPost;
  if (post.status === "pending") {
    await notifySocialPostSubmitted(post).catch(() => {});
  }
  return post;
}

export async function approveSocialPost(postId: string): Promise<void> {
  const { data, error } = await supabase
    .from("social_posts")
    .update({ status: "approved" })
    .eq("id", postId)
    .select()
    .single();
  if (error) throw error;
  await notifySocialPostApproved(data as SocialPost).catch(() => {});
}

export async function deleteSocialPost(post: Pick<SocialPost, "id" | "storage_path">): Promise<void> {
  const { error: storageError } = await supabase.storage.from("social-posts").remove([post.storage_path]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
  if (error) throw error;
}

// Paylaşım onay beklemeye düşünce o branşın baş+yardımcı antrenörlerine,
// coach_branches uzmanlarına ve koordinatörüne bildirim gider — events.ts
// notifyRegistrationSubmitted deseninin birebir kopyası. Admin'e bildirim
// GİTMEZ (kullanıcının "admine onay gerek yok" kararı — admin sessiz bir
// güvenlik ağı olarak kalır, akışa dahil edilmez).
async function notifySocialPostSubmitted(post: SocialPost): Promise<void> {
  const recipients = new Set<string>();

  const { data: branchGroups } = await supabase.from("groups").select("id, head_coach_id").eq("branch", post.branch);
  const groupIds = (branchGroups ?? []).map((g) => g.id);
  (branchGroups ?? []).forEach((g) => g.head_coach_id && recipients.add(g.head_coach_id));

  if (groupIds.length > 0) {
    const { data: assistants } = await supabase.from("group_coaches").select("coach_id").in("group_id", groupIds);
    (assistants ?? []).forEach((a) => recipients.add(a.coach_id));
  }

  const { data: branchRow } = await supabase
    .from("branches")
    .select("id, coordinator_user_id")
    .eq("name", post.branch)
    .maybeSingle();
  if (branchRow?.coordinator_user_id) recipients.add(branchRow.coordinator_user_id);
  if (branchRow?.id) {
    const { data: specialists } = await supabase.from("coach_branches").select("coach_id").eq("branch_id", branchRow.id);
    (specialists ?? []).forEach((s) => recipients.add(s.coach_id));
  }

  recipients.delete(post.author_id);
  if (recipients.size === 0) return;

  const title = "Sosyal Alan — Onay Bekleyen Paylaşım";
  const body = `${post.branch} branşında bir paylaşım onayını bekliyor.`;
  await Promise.all(
    Array.from(recipients).map((id) =>
      sendNotification(id, title, body, "social_post_submitted", { branch: post.branch }).catch(() => {})
    )
  );
}

async function notifySocialPostApproved(post: SocialPost): Promise<void> {
  await sendNotification(
    post.author_id,
    "Paylaşımın Onaylandı",
    "Sosyal Alan'a eklediğin paylaşım onaylandı ve yayında.",
    "social_post_approved"
  ).catch(() => {});
}
