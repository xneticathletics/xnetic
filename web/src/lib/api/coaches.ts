import { supabase } from "../supabase";
import { getClubSettings } from "./clubSettings";
import { getCurrentClubId } from "./currentUser";

export type Coach = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  photo_url: string | null;
  birth_date: string | null;
  education_level: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

const COACH_FIELDS =
  "id, name, email, phone, is_active, photo_url, birth_date, education_level, address, emergency_contact_name, emergency_contact_phone";

export async function listCoaches(opts?: { includeInactive?: boolean }): Promise<Coach[]> {
  let query = supabase.from("users").select(COACH_FIELDS).eq("role", "coach");
  if (!opts?.includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCoach(id: string): Promise<Coach> {
  const { data, error } = await supabase.from("users").select(COACH_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateCoach(id: string, input: Partial<Omit<Coach, "id" | "is_active">>) {
  const { error } = await supabase.from("users").update(input).eq("id", id);
  if (error) throw error;
}

export async function getCoachGroups(coachId: string): Promise<{ id: string; name: string; branch: string }[]> {
  const [headResult, assistantResult] = await Promise.all([
    supabase.from("groups").select("id, name, branch").eq("head_coach_id", coachId),
    supabase.from("group_coaches").select("groups(id, name, branch)").eq("coach_id", coachId),
  ]);
  if (headResult.error) throw headResult.error;
  if (assistantResult.error) throw assistantResult.error;

  const head = (headResult.data ?? []).map((g) => ({ id: g.id, name: g.name, branch: g.branch }));
  const assistant = ((assistantResult.data as any[]) ?? [])
    .filter((r) => r.groups)
    .map((r) => ({ id: r.groups.id, name: r.groups.name, branch: r.groups.branch }));
  return [...head, ...assistant];
}

export type CoachBranchInfo = { branch_id: string; branch_name: string; level: number };

export async function getAllCoachBranches(): Promise<Record<string, CoachBranchInfo[]>> {
  const { data, error } = await supabase.from("coach_branches").select("coach_id, branch_id, level, branches(name)");
  if (error) throw error;
  const map: Record<string, CoachBranchInfo[]> = {};
  (data as any[] ?? []).forEach((r) => {
    (map[r.coach_id] ??= []).push({ branch_id: r.branch_id, level: r.level, branch_name: r.branches?.name ?? "?" });
  });
  return map;
}

export async function setCoachBranches(coachId: string, entries: { branch_id: string; level: number }[]) {
  const { error: delError } = await supabase.from("coach_branches").delete().eq("coach_id", coachId);
  if (delError) throw delError;
  if (entries.length === 0) return;
  const { error: insError } = await supabase
    .from("coach_branches")
    .insert(entries.map((e) => ({ coach_id: coachId, branch_id: e.branch_id, level: e.level })));
  if (insError) throw insError;
}

export async function deactivateCoach(userId: string) {
  const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId);
  if (error) throw error;
}

export async function reactivateCoach(userId: string) {
  const { error } = await supabase.from("users").update({ is_active: true }).eq("id", userId);
  if (error) throw error;
}

// Antrenörün branş/grup atamalarını önce elle temizliyoruz — aksi halde
// bazı ilişkili tablolardaki foreign key kısıtlamaları (ör. groups.head_coach_id)
// silme işlemini engelleyebilir. Auth hesabı (giriş bilgisi) bu işlemle
// silinmiyor — sadece kulüp kaydı kaldırılıyor, giriş bir daha bir kulübe
// bağlı çalışmadığı için işlevsiz kalıyor.
export async function deleteCoachPermanently(userId: string) {
  await supabase.from("coach_branches").delete().eq("coach_id", userId);
  await supabase.from("group_coaches").delete().eq("coach_id", userId);
  await supabase.from("groups").update({ head_coach_id: null }).eq("head_coach_id", userId);
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) throw error;
}

export type GroupAssignment = "none" | "head" | "assistant";

export type GroupStaffingDetailed = {
  headCoachId: string | null;
  headCoachName: string | null;
  assistants: { id: string; name: string }[];
};

export async function getGroupStaffingDetailed(): Promise<Record<string, GroupStaffingDetailed>> {
  const [groupsResult, assistantsResult] = await Promise.all([
    supabase.from("groups").select("id, head_coach_id, head:head_coach_id(name)"),
    supabase.from("group_coaches").select("group_id, coach_id, coach:coach_id(name)"),
  ]);
  if (groupsResult.error) throw groupsResult.error;
  if (assistantsResult.error) throw assistantsResult.error;

  const map: Record<string, GroupStaffingDetailed> = {};
  (groupsResult.data as any[] ?? []).forEach((g) => {
    map[g.id] = { headCoachId: g.head_coach_id ?? null, headCoachName: g.head?.name ?? null, assistants: [] };
  });
  (assistantsResult.data as any[] ?? []).forEach((row) => {
    if (!map[row.group_id]) map[row.group_id] = { headCoachId: null, headCoachName: null, assistants: [] };
    if (row.coach?.name) map[row.group_id].assistants.push({ id: row.coach_id, name: row.coach.name });
  });
  return map;
}

export async function setCoachAssignment(coachId: string, groupId: string, assignment: GroupAssignment) {
  await supabase.from("group_coaches").delete().eq("coach_id", coachId).eq("group_id", groupId);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("head_coach_id")
    .eq("id", groupId)
    .single();
  if (groupError) throw groupError;

  if (group?.head_coach_id === coachId) {
    const { error } = await supabase.from("groups").update({ head_coach_id: null }).eq("id", groupId);
    if (error) throw error;
  }

  if (assignment === "head") {
    const { error } = await supabase.from("groups").update({ head_coach_id: coachId }).eq("id", groupId);
    if (error) throw error;
  } else if (assignment === "assistant") {
    const clubId = await getCurrentClubId();
    if (!clubId) throw new Error("Kulüp bulunamadı");
    const { assistant_coach_limit } = await getClubSettings(clubId);
    const { data: existing, error: countError } = await supabase
      .from("group_coaches")
      .select("coach_id")
      .eq("group_id", groupId);
    if (countError) throw countError;
    const otherAssistants = (existing ?? []).filter((r) => r.coach_id !== coachId);
    if (otherAssistants.length >= assistant_coach_limit) {
      throw new Error(`Bu grupta zaten ${assistant_coach_limit} Yardımcı Antrenör var. Önce birini çıkarmalısın.`);
    }
    const { error } = await supabase
      .from("group_coaches")
      .upsert({ coach_id: coachId, group_id: groupId, permission_level: "assistant_coach" }, { onConflict: "group_id,coach_id" });
    if (error) throw error;
  }
}
