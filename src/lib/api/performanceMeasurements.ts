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

// Test Grubu ekranındaki hızlı giriş için: birden çok sporcu/test ölçümünü
// TEK insert ile kaydeder.
export async function createMeasurements(inputs: PerformanceMeasurementInput[]) {
  if (inputs.length === 0) return;
  const { error } = await supabase.from("performance_measurements").insert(inputs);
  if (error) throw error;
}

// Verilen sporcu/test çiftleri için en SON ölçümü döner ("athleteId|testKey"
// anahtarlı) — hızlı girişte "son ölçüm: ..." ipucu için, tek sorguyla.
export async function listLatestMeasurements(
  athleteIds: string[],
  testKeys: string[]
): Promise<Map<string, { value: number; measured_at: string }>> {
  const latest = new Map<string, { value: number; measured_at: string }>();
  if (athleteIds.length === 0 || testKeys.length === 0) return latest;
  const { data, error } = await supabase
    .from("performance_measurements")
    .select("athlete_id, test_key, value, measured_at")
    .in("athlete_id", athleteIds)
    .in("test_key", testKeys)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  (data ?? []).forEach((m) => {
    const key = `${m.athlete_id}|${m.test_key}`;
    if (!latest.has(key)) latest.set(key, { value: m.value, measured_at: m.measured_at });
  });
  return latest;
}

export async function deleteMeasurement(id: string) {
  const { error } = await supabase.from("performance_measurements").delete().eq("id", id);
  if (error) throw error;
}
