import { supabase } from "../supabase";

// Performans testleri artık tamamen veritabanında (performance_test_catalog)
// — fitness_exercises ile birebir aynı desen. club_id NULL olanlar "global"
// (Süper Admin'in eklediği, TÜM kulüplerin gördüğü) testler, club_id dolu
// olanlar sadece o kulübe özel.
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

export type CustomPerformanceTestInput = {
  category: string;
  name: string;
  unit: string;
  equipment: string | null;
  instructions: string;
  video_url: string | null;
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

// Süper Admin'in "İçerik Kütüphanesi" ekranındaki "Mevcut İçerik" listesi
// için — kategoriden bağımsız, TÜM global (club_id NULL) testler.
export async function listGlobalTests(): Promise<CustomPerformanceTest[]> {
  const { data, error } = await supabase.from("performance_test_catalog").select(FIELDS).is("club_id", null).order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCustomTest(id: string): Promise<CustomPerformanceTest | null> {
  const { data, error } = await supabase.from("performance_test_catalog").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCustomTest(input: CustomPerformanceTestInput) {
  const { data, error } = await supabase.from("performance_test_catalog").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCustomTest(id: string, input: CustomPerformanceTestInput) {
  const { data, error } = await supabase.from("performance_test_catalog").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCustomTest(id: string) {
  const { error } = await supabase.from("performance_test_catalog").delete().eq("id", id);
  if (error) throw error;
}
