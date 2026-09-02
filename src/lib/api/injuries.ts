import { supabase } from "../supabase";

export type Injury = {
  id: string;
  athlete_id: string;
  injury_type: string;
  injury_date: string;
  expected_return: string | null;
  note: string | null;
  created_at: string;
};

export type InjuryInput = {
  athlete_id: string;
  injury_type: string;
  injury_date: string;
  expected_return: string | null;
  note: string | null;
};

export async function listInjuries(athleteId: string): Promise<Injury[]> {
  const { data, error } = await supabase
    .from("injuries")
    .select("id, athlete_id, injury_type, injury_date, expected_return, note, created_at")
    .eq("athlete_id", athleteId)
    .order("injury_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Not: Admin/Veliye otomatik push/SMS bildirimi, Bildirim Sistemi (Faz 2)
// tamamlanınca eklenecek — şimdilik kayıt sporcunun sakatlık geçmişine
// düşüyor ve uygulama içinde görünüyor.
export async function createInjury(input: InjuryInput) {
  const { data, error } = await supabase.from("injuries").insert(input).select().single();
  if (error) throw error;
  return data;
}
