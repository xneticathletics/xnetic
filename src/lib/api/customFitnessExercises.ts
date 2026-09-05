import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

// Egzersizler artık tamamen veritabanında (fitness_exercises) — club_id
// NULL olanlar "global" (Süper Admin'in eklediği, TÜM kulüplerin gördüğü)
// hareketler, club_id dolu olanlar sadece o kulübe özel hareketler.
export type CustomFitnessExercise = {
  id: string;
  club_id: string | null;
  category: string;
  name: string;
  bodyweight: boolean;
  video_url: string | null;
  description: string | null;
  created_at: string;
  // Süper Admin, global olmayan (başka bir kulübe ait) satırlarda hangi
  // kulübün eklediğini görebilsin diye — sadece Süper Admin sorgularında
  // dolu gelir (RLS diğer herkes için başka kulüplerin satırını zaten hiç döndürmüyor).
  clubs?: { name: string } | null;
};

export type CustomFitnessExerciseInput = {
  category: string;
  name: string;
  bodyweight: boolean;
  video_url: string | null;
  description: string | null;
};

const FIELDS = "id, club_id, category, name, bodyweight, video_url, description, created_at";

// clubs!club_id: club_hidden_fitness_exercises tablosu (exercise_id VE
// club_id'ye referans veriyor) fitness_exercises↔clubs arasında dolaylı
// ikinci bir ilişki yolu oluşturduğu için PostgREST hangi FK'yı
// kullanacağını açıkça bilmek istiyor — belirtilmezse "more than one
// relationship was found" hatası atıp sorguyu tamamen reddediyor (hareket
// listesi sessizce boş kalıyordu).
export async function listCustomExercisesByCategory(category: string): Promise<CustomFitnessExercise[]> {
  const { data, error } = await supabase
    .from("fitness_exercises")
    .select(`${FIELDS}, clubs!club_id(name)`)
    .eq("category", category)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as unknown as CustomFitnessExercise[]) ?? [];
}

export async function getCustomExercise(id: string): Promise<CustomFitnessExercise | null> {
  const { data, error } = await supabase.from("fitness_exercises").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCustomExercise(input: CustomFitnessExerciseInput) {
  const { data, error } = await supabase.from("fitness_exercises").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCustomExercise(id: string, input: CustomFitnessExerciseInput) {
  const { data, error } = await supabase.from("fitness_exercises").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// "fitness-exercise-videos" bucket'ında da bu değerle senkron (bkz.
// supabase/migrations/..._fitness_exercises_global_library.sql) — 1GB gibi
// aşırı büyük dosyalar yüklenemesin diye standart bir üst sınır: kısa bir
// hareket videosu için (30-60sn, orta kalite) fazlasıyla yeterli.
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

// Hareket videosunu yükler — web'deki src/lib/api/fitnessExercises.ts
// (uploadExerciseVideo) ile aynı "fitness-exercise-videos" bucket'ı, sadece
// dosya okuma yöntemi RN'e özel (clubLogo.ts'teki uploadClubLogo ile birebir
// aynı desen). clubId null ise (Süper Admin, global hareket ekliyor)
// "global/" klasörüne yüklenir.
export async function uploadExerciseVideo(localUri: string, clubId: string | null): Promise<string> {
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
    .from("fitness-exercise-videos")
    .upload(path, arrayBuffer, { contentType: `video/${ext === "mov" ? "quicktime" : ext}` });
  if (error) throw error;

  const { data } = supabase.storage.from("fitness-exercise-videos").getPublicUrl(path);
  return data.publicUrl;
}
