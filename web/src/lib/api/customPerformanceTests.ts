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
  lower_is_better: boolean | null;
  created_at: string;
};

export type CustomPerformanceTestInput = {
  category: string;
  name: string;
  unit: string;
  equipment: string | null;
  instructions: string;
  video_url: string | null;
  lower_is_better?: boolean | null;
};

const FIELDS = "id, club_id, category, name, unit, equipment, instructions, video_url, lower_is_better, created_at";

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

// Birim saniye/dakika gibiyse DÜŞÜK değer iyidir (mobildeki aynı liste).
export function isLowerBetterUnit(unit: string): boolean {
  const u = unit.trim().toLowerCase().replace(/\./g, "");
  return ["sn", "s", "sec", "saniye", "dk", "dak", "dakika", "ms"].includes(u);
}

export function resolveLowerIsBetter(test: Pick<CustomPerformanceTest, "lower_is_better" | "unit">): boolean {
  return test.lower_is_better ?? isLowerBetterUnit(test.unit);
}

// Test grubu oluştururken tüm testler arasından seçim yapılıyor.
export async function listAllTests(): Promise<CustomPerformanceTest[]> {
  const { data, error } = await supabase
    .from("performance_test_catalog")
    .select(FIELDS)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Sporcunun ölçüm geçmişindeki test_key'lerden test tanımlarını çözmek için.
export async function getCustomTestsByIds(ids: string[]): Promise<CustomPerformanceTest[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("performance_test_catalog").select(FIELDS).in("id", ids);
  if (error) throw error;
  return data ?? [];
}

// "performance-test-videos" bucket'ındaki sınırla senkron (mobildeki ile aynı).
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

// Test tanımına video ekleme — clubId null ise (Süper Admin, global test)
// "global/" klasörüne yüklenir. Mobildeki uploadTestVideo ile aynı yol/bucket.
export async function uploadTestVideo(file: File, clubId: string | null): Promise<string> {
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(`Video en fazla ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const folder = clubId ?? "global";
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("performance-test-videos")
    .upload(path, file, { contentType: file.type || `video/${ext}` });
  if (error) throw error;
  const { data } = supabase.storage.from("performance-test-videos").getPublicUrl(path);
  return data.publicUrl;
}
