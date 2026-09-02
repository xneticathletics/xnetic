import { supabase } from "../supabase";

// Mobil src/lib/api/performanceMeasurements.ts ile birebir aynı tablo/kolonlar
// (performance_measurements) — aynı Supabase backend, aynı RLS varsayımları.

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

// Bir sporcunun BELİRLİ bir testteki tüm geçmiş ölçümlerini (en yeni önce) döner.
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

// Bir sporcunun TÜM testlerdeki geçmişini döner.
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

// Mobilde yok — web tarafında geçmiş kayıtları düzenleyebilmek için eklendi.
// Aynı tablo/kolonlar üzerinde çalışır, yeni bir DB şeması gerektirmez.
export async function updateMeasurement(id: string, input: Partial<PerformanceMeasurementInput>) {
  const { data, error } = await supabase.from("performance_measurements").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMeasurement(id: string) {
  const { error } = await supabase.from("performance_measurements").delete().eq("id", id);
  if (error) throw error;
}
