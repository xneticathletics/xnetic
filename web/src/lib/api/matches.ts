import { supabase } from "../supabase";

export type MatchRow = {
  id: string;
  group_id: string | null;
  opponent_name: string;
  match_date: string;
  start_time: string;
  location: string | null;
  notes: string | null;
  groups?: { name: string; branch: string } | null;
};

export type MatchInput = {
  group_id: string | null;
  opponent_name: string;
  match_date: string;
  start_time: string;
  location: string | null;
  notes: string | null;
};

const MATCH_FIELDS = "id, group_id, opponent_name, match_date, start_time, location, notes";

export async function listMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(`${MATCH_FIELDS}, groups(name, branch)`)
    .order("match_date", { ascending: true });
  if (error) throw error;
  return (data as unknown as MatchRow[]) ?? [];
}

export async function createMatch(input: MatchInput) {
  const { data, error } = await supabase.from("matches").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateMatch(id: string, input: MatchInput) {
  const { data, error } = await supabase.from("matches").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw error;
}
