import { supabase } from "../supabase";

export type AthleteStatus = "active" | "passive";
export type AthleteType = "spor_okulu" | "musabik";

export type Athlete = {
  id: string;
  full_name: string;
  birth_date: string | null;
  group_id: string | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  license_no: string | null;
  school: string | null;
  jersey_size: string | null;
  status: AthleteStatus;
  athlete_type: AthleteType;
  photo_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  groups?: { name: string } | null;
};

export type AthleteInput = {
  full_name: string;
  birth_date: string | null;
  group_id: string | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  license_no: string | null;
  school: string | null;
  jersey_size: string | null;
  status: AthleteStatus;
  athlete_type: AthleteType;
  photo_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
};

const ATHLETE_FIELDS =
  "id, full_name, birth_date, group_id, blood_type, height_cm, weight_kg, license_no, school, jersey_size, status, athlete_type, photo_url, parent_name, parent_phone";

export async function listAllAthletes(): Promise<Athlete[]> {
  const { data, error } = await supabase
    .from("athletes")
    .select(`${ATHLETE_FIELDS}, groups!group_id(name)`)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data as unknown as Athlete[]) ?? [];
}

export async function getAthlete(id: string): Promise<Athlete> {
  const { data, error } = await supabase
    .from("athletes")
    .select(`${ATHLETE_FIELDS}, groups!group_id(name)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Athlete;
}

export async function createAthlete(input: AthleteInput) {
  const { data, error } = await supabase.from("athletes").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateAthlete(id: string, input: Partial<AthleteInput>) {
  const { data, error } = await supabase.from("athletes").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Dikkat: attendance, payments, injuries, athlete_notes, session_rpe
// tabloları athlete_id üzerinden "on delete cascade" ile tanımlı — bir
// sporcu silinirse ona ait TÜM yoklama/aidat/sakatlık/not geçmişi de
// silinir. Çağıran ekran, silmeden önce kullanıcıyı bu konuda uyarmalı.
export async function deleteAthlete(id: string) {
  const { error } = await supabase.from("athletes").delete().eq("id", id);
  if (error) throw error;
}

// Galeriden/dosya sisteminden seçilen fotoğrafı Supabase Storage'daki
// "athlete-photos" bucket'ına yükler ve herkese açık URL döner. Web'de
// mobildeki base64 dönüşümüne gerek yok — File nesnesi doğrudan yüklenir.
export async function uploadAthletePhoto(athleteId: string, file: File): Promise<string> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const path = `${athleteId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("athlete-photos")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("athlete-photos").getPublicUrl(path);
  return data.publicUrl;
}
