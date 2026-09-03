import { supabase } from "../supabase";

// Antrenörün/admin'in sabit kataloğa (web/src/lib/fitnessExercises.ts) ek
// olarak kulübe özel eklediği egzersizler — mobildeki
// src/lib/api/customFitnessExercises.ts ile aynı "fitness_exercises"
// tablosu/kolonları. Web paneli ayrıca update/delete de sunar (mobilde
// sadece koç/antrenör ekliyordu, admin panelinde düzenleme/silme de gerekir).
export type CustomFitnessExercise = {
  id: string;
  category: string;
  name: string;
  bodyweight: boolean;
  video_url: string | null;
  description: string | null;
  created_at: string;
};

export type CustomFitnessExerciseInput = {
  category: string;
  name: string;
  bodyweight: boolean;
  video_url: string | null;
  description: string | null;
};

const FIELDS = "id, category, name, bodyweight, video_url, description, created_at";

// Hareket videosunu kulübün klasörüne yükler (club-logos/athlete-photos ile
// aynı desen) — henüz kaydedilmemiş (yeni) bir egzersiz için de çalışsın diye
// dosya adı egzersiz id'sine değil, rastgele bir belirtece bağlı; "url
// yapıştır" alternatifiyle aynı video_url sütununu doldurur.
export async function uploadExerciseVideo(file: File, clubId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${clubId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("fitness-exercise-videos")
    .upload(path, file, { contentType: file.type || "video/mp4" });
  if (error) throw error;
  const { data } = supabase.storage.from("fitness-exercise-videos").getPublicUrl(path);
  return data.publicUrl;
}

export async function listCustomExercisesByCategory(category: string): Promise<CustomFitnessExercise[]> {
  const { data, error } = await supabase
    .from("fitness_exercises")
    .select(FIELDS)
    .eq("category", category)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllCustomExercises(): Promise<CustomFitnessExercise[]> {
  const { data, error } = await supabase.from("fitness_exercises").select(FIELDS).order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
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

// Dikkat: fitness_program_items.exercise_key bu kaydın "custom:<id>"
// anahtarına referans veriyor olabilir — silinen bir egzersiz daha önce bir
// programa eklendiyse, o programdaki satır adı/anahtarı geçersiz kalır
// (mobil tarafta da aynı davranış).
export async function deleteCustomExercise(id: string) {
  const { error } = await supabase.from("fitness_exercises").delete().eq("id", id);
  if (error) throw error;
}
