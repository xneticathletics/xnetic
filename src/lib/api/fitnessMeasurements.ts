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

// FitnessProgramDetailScreen/Page'deki "Tamamlayanlar" listesinde, bir
// tamamlama satırına tıklayınca o an girilen set bazlı ağırlık/tekrar
// detaylarını göstermek için — tamamlama zamanına (completed_at) YAKIN bir
// zaman penceresindeki kayıtları getirir. ÖNEMLİ: bilerek "measured_at bu
// güne eşit mi" diye TARİH STRING'i karşılaştırmıyoruz — measured_at yerel
// tarihle (todayKey()) yazılırken completed_at UTC olarak saklanıyor;
// gece yarısına yakın (TR saatiyle 00:00-03:00 arası) tamamlanan bir
// antrenmanda bu iki tarih FARKLI güne denk gelip kaydı "yok" gibi
// gösterebiliyordu (canlıda tam olarak bu şekilde yaşandı). created_at
// (her ikisi de aynı handleMarkCompleted çağrısında, saniyeler arayla
// yazılıyor) üzerinden dar bir zaman penceresiyle karşılaştırmak bu
// zaman dilimi belirsizliğinden tamamen bağımsız.
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
