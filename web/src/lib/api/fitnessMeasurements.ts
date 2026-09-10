import { supabase } from "../supabase";

// Sporcunun gerçek antrenman kayıtları (ağırlık/set/tekrar) — mobildeki
// src/lib/api/fitnessMeasurements.ts ile aynı. Web'de sadece bireysel
// program detayında geçmiş göstermek için okunuyor, yazma yok.
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

// Bir sporcunun belirli bir güne ait TÜM ölçüm kayıtlarını döner —
// FitnessProgramDetailPage'deki "Tamamlayanlar" listesinde, bir tamamlama
// satırına tıklayınca o gün girilen set bazlı ağırlık/tekrar detaylarını
// göstermek için (mobildeki aynı fonksiyonla birebir aynı).
export async function listMeasurementsForAthleteOnDate(athleteId: string, date: string): Promise<FitnessMeasurement[]> {
  const { data, error } = await supabase
    .from("fitness_measurements")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .eq("measured_at", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
