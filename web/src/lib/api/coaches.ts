import { supabase } from "../supabase";
import { getClubSettings } from "./clubSettings";

export type Coach = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  coach_level: number | null;
};

const COACH_FIELDS = "id, name, email, phone, coach_level";

export async function listCoaches(): Promise<Coach[]> {
  const { data, error } = await supabase
    .from("users")
    .select(COACH_FIELDS)
    .eq("role", "coach")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
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

export async function updateCoachLevel(id: string, level: number | null) {
  const { error } = await supabase.from("users").update({ coach_level: level }).eq("id", id);
  if (error) throw error;
}

// Antrenörü tam silmiyoruz — hesabı pasifleştiriyoruz (listCoaches zaten
// is_active=true filtresiyle çalışıyor, pasifleşen otomatik kalkar).
export async function deactivateCoach(userId: string) {
  const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId);
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
    const { assistant_coach_limit } = await getClubSettings();
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
