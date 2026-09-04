import { supabase } from "../supabase";

// Kulübün, GLOBAL fitness hareketlerinden hangilerini kendi görünümünden
// gizlediğini yönetir — bkz. mobildeki src/lib/api/fitnessExerciseVisibility.ts
// ile aynı desen / aynı tablo (club_hidden_fitness_exercises).

export async function listHiddenExerciseIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("club_hidden_fitness_exercises").select("exercise_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.exercise_id as string));
}

export async function hideExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase.from("club_hidden_fitness_exercises").insert({ exercise_id: exerciseId });
  if (error) throw error;
}

export async function showExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase.from("club_hidden_fitness_exercises").delete().eq("exercise_id", exerciseId);
  if (error) throw error;
}
