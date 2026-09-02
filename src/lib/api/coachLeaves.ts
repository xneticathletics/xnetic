import { supabase } from "../supabase";

export type CoachLeave = {
  id: string;
  coach_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

export type CoachLeaveInput = {
  coach_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
};

const FIELDS = "id, coach_id, start_date, end_date, reason, created_at";

export async function listCoachLeaves(coachId: string): Promise<CoachLeave[]> {
  const { data, error } = await supabase
    .from("coach_leaves")
    .select(FIELDS)
    .eq("coach_id", coachId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCoachLeave(input: CoachLeaveInput) {
  const { data, error } = await supabase.from("coach_leaves").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCoachLeave(id: string) {
  const { error } = await supabase.from("coach_leaves").delete().eq("id", id);
  if (error) throw error;
}
