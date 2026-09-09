import { supabase } from "../supabase";

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

export type IndividualFitnessProgramItemInput = {
  category: string;
  exercise_key: string;
  exercise_name: string;
  sets: number;
  reps: number;
};

const PROGRAM_FIELDS = "id, athlete_id, name, created_at";
const ITEM_FIELDS = "id, program_id, category, exercise_key, exercise_name, sets, reps, sort_order";

export async function listMyIndividualPrograms(athleteId: string): Promise<IndividualFitnessProgram[]> {
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

// Programı ve tüm hareket kayıtlarını tek seferde oluşturur — publishFitnessProgram
// (fitnessPrograms.ts) ile aynı iki adımlı desen, ama hedef grup/bildirim
// yok çünkü bu tamamen kişisel bir program.
export async function createIndividualProgram(input: {
  athlete_id: string;
  name: string;
  items: IndividualFitnessProgramItemInput[];
}) {
  const { data: program, error: programError } = await supabase
    .from("individual_fitness_programs")
    .insert({ athlete_id: input.athlete_id, name: input.name })
    .select()
    .single();
  if (programError) throw programError;

  const rows = input.items.map((item, index) => ({
    program_id: program.id,
    category: item.category,
    exercise_key: item.exercise_key,
    exercise_name: item.exercise_name,
    sets: item.sets,
    reps: item.reps,
    sort_order: index,
  }));
  const { error: itemsError } = await supabase.from("individual_fitness_program_items").insert(rows);
  if (itemsError) throw itemsError;

  return program;
}

export async function deleteIndividualProgram(id: string) {
  const { error } = await supabase.from("individual_fitness_programs").delete().eq("id", id);
  if (error) throw error;
}
