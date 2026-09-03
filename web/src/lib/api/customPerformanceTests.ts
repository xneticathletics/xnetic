import { supabase } from "../supabase";

// Performans testleri artık tamamen veritabanında (performance_test_catalog)
// — fitness_exercises ile birebir aynı desen. club_id NULL olanlar "global"
// (Süper Admin'in eklediği, TÜM kulüplerin gördüğü) testler, club_id dolu
// olanlar sadece o kulübe özel. Ekleme/düzenleme sadece mobildeki Süper
// Admin panelinden yapılıyor — web sadece okuyup ölçüm kaydediyor.
export type CustomPerformanceTest = {
  id: string;
  club_id: string | null;
  category: string;
  name: string;
  unit: string;
  equipment: string | null;
  instructions: string;
  video_url: string | null;
  created_at: string;
};

const FIELDS = "id, club_id, category, name, unit, equipment, instructions, video_url, created_at";

export async function listTestsByCategory(category: string): Promise<CustomPerformanceTest[]> {
  const { data, error } = await supabase
    .from("performance_test_catalog")
    .select(FIELDS)
    .eq("category", category)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCustomTest(id: string): Promise<CustomPerformanceTest | null> {
  const { data, error } = await supabase.from("performance_test_catalog").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
