import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

// Antrenörün/admin'in "+ Çalışma Ekle" ile sabit kataloğa eklediği kendi
// egzersizleri — sabit FITNESS_CATEGORIES kataloğuyla (src/lib/fitnessExercises.ts)
// birlikte kullanılır, onu değiştirmez, üzerine ekler.
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

export async function listCustomExercisesByCategory(category: string): Promise<CustomFitnessExercise[]> {
  const { data, error } = await supabase
    .from("fitness_exercises")
    .select(FIELDS)
    .eq("category", category)
    .order("name", { ascending: true });
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

// Hareket videosunu kulübün klasörüne yükler — web'deki
// src/lib/api/fitnessExercises.ts (uploadExerciseVideo) ile aynı
// "fitness-exercise-videos" bucket'ı, sadece dosya okuma yöntemi RN'e özel
// (clubLogo.ts'teki uploadClubLogo ile birebir aynı desen).
export async function uploadExerciseVideo(localUri: string, clubId: string): Promise<string> {
  const ext = localUri.split(".").pop()?.split("?")[0] || "mp4";
  const path = `${clubId}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("fitness-exercise-videos")
    .upload(path, arrayBuffer, { contentType: `video/${ext === "mov" ? "quicktime" : ext}` });
  if (error) throw error;

  const { data } = supabase.storage.from("fitness-exercise-videos").getPublicUrl(path);
  return data.publicUrl;
}
