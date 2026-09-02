import { supabase } from "../supabase";

export type AthleteNote = {
  id: string;
  note: string;
  created_at: string;
};

export async function listAthleteNotes(athleteId: string): Promise<AthleteNote[]> {
  const { data, error } = await supabase
    .from("athlete_notes")
    .select("id, note, created_at")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAthleteNote(athleteId: string, note: string) {
  const { data, error } = await supabase
    .from("athlete_notes")
    .insert({ athlete_id: athleteId, note })
    .select()
    .single();
  if (error) throw error;
  return data;
}
