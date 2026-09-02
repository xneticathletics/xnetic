import { supabase } from "../supabase";

// Antrenörün/admin'in "+ Çalışma Ekle" ile sabit kataloğa eklediği kendi
// egzersizleri — sabit FITNESS_CATEGORIES kataloğuyla (src/lib/fitnessExercises.ts)
// birlikte kullanılır, onu değiştirmez, üzerine ekler.
export type CustomFitnessExercise = {
  id: string;
  category: string;
  name: string;
  bodyweight: boolean;
  created_at: string;
};

export type CustomFitnessExerciseInput = {
  category: string;
  name: string;
  bodyweight: boolean;
};

const FIELDS = "id, category, name, bodyweight, created_at";

export async function listCustomExercisesByCategory(category: string): Promise<CustomFitnessExercise[]> {
  const { data, error } = await supabase
    .from("fitness_exercises")
    .select(FIELDS)
    .eq("category", category)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCustomExercise(id: string): Promise<CustomFitnessExercise | null> {
  const { data, error } = await supabase.from("fitness_exercises").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCustomExercise(input: CustomFitnessExerciseInput) {
  const { data, error } = await supabase.from("fitness_exercises").insert(input).select().single();
  if (error) throw error;
  return data;
}
