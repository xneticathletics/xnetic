import { supabase } from "../supabase";

// Sporcunun kendi yazdığı, kulübün atamadığı bireysel fitness programları —
// mobildeki src/lib/api/individualFitnessPrograms.ts ile aynı. Web'de
// SADECE admin salt-okunur inceleme + silme için var (oluşturma yok —
// programı sporcunun kendisi mobil uygulamadan yazıyor).
export type IndividualFitnessProgram = {
  id: string;
  athlete_id: string;
  name: string;
  created_at: string;
};

export type IndividualFitnessProgramItem = {
  id: string;
  program_id: string;
  category: string;
  exercise_key: string;
  exercise_name: string;
  sets: number;
  reps: number;
  sort_order: number;
};

const PROGRAM_FIELDS = "id, athlete_id, name, created_at";
const ITEM_FIELDS = "id, program_id, category, exercise_key, exercise_name, sets, reps, sort_order";

export async function listIndividualPrograms(athleteId: string): Promise<IndividualFitnessProgram[]> {
  const { data, error } = await supabase
    .from("individual_fitness_programs")
    .select(PROGRAM_FIELDS)
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getIndividualProgram(id: string): Promise<IndividualFitnessProgram> {
  const { data, error } = await supabase.from("individual_fitness_programs").select(PROGRAM_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listIndividualProgramItems(programId: string): Promise<IndividualFitnessProgramItem[]> {
  const { data, error } = await supabase
    .from("individual_fitness_program_items")
    .select(ITEM_FIELDS)
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function deleteIndividualProgram(id: string) {
  const { error } = await supabase.from("individual_fitness_programs").delete().eq("id", id);
  if (error) throw error;
}
