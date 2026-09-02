import { supabase } from "../supabase";

export type FitnessMeasurement = {
  id: string;
  athlete_id: string;
  exercise_key: string;
  weight_kg: number | null;
  sets: number | null;
  reps: number | null;
  measured_at: string;
  notes: string | null;
  created_at: string;
};

export type FitnessMeasurementInput = {
  athlete_id: string;
  exercise_key: string;
  weight_kg: number | null;
  sets: number | null;
  reps: number | null;
  measured_at: string;
  notes: string | null;
};

const FIELDS = "id, athlete_id, exercise_key, weight_kg, sets, reps, measured_at, notes, created_at";

export async function listMeasurementsForAthleteExercise(athleteId: string, exerciseKey: string): Promise<FitnessMeasurement[]> {
  const { data, error } = await supabase
    .from("fitness_measurements")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .eq("exercise_key", exerciseKey)
    .order("measured_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Bir sporcunun TÜM hareketlerdeki geçmişini döner — Veli/Sporcu'nun kendi
// takip ekranındaki "Çalışma" görünümü için (salt okunur).
export async function listAllMeasurementsForAthlete(athleteId: string): Promise<FitnessMeasurement[]> {
  const { data, error } = await supabase
    .from("fitness_measurements")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .order("measured_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFitnessMeasurement(input: FitnessMeasurementInput) {
  const { data, error } = await supabase.from("fitness_measurements").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFitnessMeasurement(id: string) {
  const { error } = await supabase.from("fitness_measurements").delete().eq("id", id);
  if (error) throw error;
}
