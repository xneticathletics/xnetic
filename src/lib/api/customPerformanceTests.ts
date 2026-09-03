import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

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
  // Süper Admin, global olmayan (başka bir kulübe ait) satırlarda hangi
  // kulübün eklediğini görebilsin diye — sadece Süper Admin sorgularında
  // dolu gelir (RLS diğer herkes için başka kulüplerin satırını hiç döndürmüyor).
  clubs?: { name: string } | null;
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
    .select(`${FIELDS}, clubs(name)`)
    .eq("category", category)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as unknown as CustomPerformanceTest[]) ?? [];
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

// "performance-test-videos" bucket'ında da bu değerle senkron (bkz.
// supabase/migrations/..._performance_tests_global_library.sql).
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

// clubId null ise (Süper Admin, global test ekliyor) "global/" klasörüne yüklenir.
export async function uploadTestVideo(localUri: string, clubId: string | null): Promise<string> {
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists && info.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(`Video en fazla ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
  }

  const ext = localUri.split(".").pop()?.split("?")[0] || "mp4";
  const folder = clubId ?? "global";
  const path = `${folder}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("performance-test-videos")
    .upload(path, arrayBuffer, { contentType: `video/${ext === "mov" ? "quicktime" : ext}` });
  if (error) throw error;

  const { data } = supabase.storage.from("performance-test-videos").getPublicUrl(path);
  return data.publicUrl;
}
