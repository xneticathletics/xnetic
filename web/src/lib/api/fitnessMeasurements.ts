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

// FitnessProgramDetailPage'deki "Tamamlayanlar" listesinde, bir tamamlama
// satırına tıklayınca o an girilen set bazlı ağırlık/tekrar detaylarını
// göstermek için — tamamlama zamanına (completed_at) YAKIN bir zaman
// penceresindeki kayıtları getirir. ÖNEMLİ: bilerek "measured_at bu güne
// eşit mi" diye tarih string'i karşılaştırmıyoruz — measured_at yerel
// tarihle yazılırken completed_at UTC saklanıyor; gece yarısına yakın
// (TR saatiyle 00:00-03:00 arası) tamamlanan bir antrenmanda bu iki tarih
// FARKLI güne denk gelip kaydı "yok" gibi gösterebiliyordu (canlıda tam
// bu şekilde yaşandı — mobildeki aynı düzeltmeyle birebir aynı).
export async function listMeasurementsNearCompletion(athleteId: string, completedAtIso: string): Promise<FitnessMeasurement[]> {
  const center = new Date(completedAtIso).getTime();
  const windowMs = 10 * 60 * 1000;
  const { data, error } = await supabase
    .from("fitness_measurements")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .gte("created_at", new Date(center - windowMs).toISOString())
    .lte("created_at", new Date(center + windowMs).toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
