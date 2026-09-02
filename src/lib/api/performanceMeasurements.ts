import { supabase } from "../supabase";

export type PerformanceMeasurement = {
  id: string;
  athlete_id: string;
  test_key: string;
  value: number;
  measured_at: string;
  notes: string | null;
  created_at: string;
};

export type PerformanceMeasurementInput = {
  athlete_id: string;
  test_key: string;
  value: number;
  measured_at: string;
  notes: string | null;
};

const FIELDS = "id, athlete_id, test_key, value, measured_at, notes, created_at";

// Bir sporcunun BELİRLİ bir testteki tüm geçmiş ölçümlerini (en yeni önce)
// döner — Performans Testi ekranındaki geçmiş listesi için.
export async function listMeasurementsForAthleteTest(athleteId: string, testKey: string): Promise<PerformanceMeasurement[]> {
  const { data, error } = await supabase
    .from("performance_measurements")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .eq("test_key", testKey)
    .order("measured_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Bir sporcunun TÜM testlerdeki geçmişini döner — Veli/Sporcu'nun kendi
// takip ekranındaki "Ölçümler" görünümü için (salt okunur, kategoriye göre
// istemci tarafında gruplanır).
export async function listAllMeasurementsForAthlete(athleteId: string): Promise<PerformanceMeasurement[]> {
  const { data, error } = await supabase
    .from("performance_measurements")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .order("measured_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMeasurement(input: PerformanceMeasurementInput) {
  const { data, error } = await supabase.from("performance_measurements").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMeasurement(id: string) {
  const { error } = await supabase.from("performance_measurements").delete().eq("id", id);
  if (error) throw error;
}
