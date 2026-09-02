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
  jersey_number: string | null;
  status: AthleteStatus;
  athlete_type: AthleteType;
  photo_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  // KVKK kapsamında ayrı "Sağlık Verisi İşleme İzni" onayı alındıktan
  // sonra eklendi (bkz. mobil src/lib/consentTexts.ts) — mobille aynı alanlar.
  health_info: string | null;
  allergies: string | null;
  medications: string | null;
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
  jersey_number: string | null;
  status: AthleteStatus;
  athlete_type: AthleteType;
  photo_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  health_info: string | null;
  allergies: string | null;
  medications: string | null;
};

const ATHLETE_FIELDS =
  "id, full_name, birth_date, group_id, blood_type, height_cm, weight_kg, license_no, school, jersey_size, jersey_number, status, athlete_type, photo_url, parent_name, parent_phone, health_info, allergies, medications";

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

// Cihazdan seçilen fotoğrafı Supabase Storage'daki "athlete-photos"
// bucket'ına yükler. Web'de mobildeki base64 dönüşümüne gerek yok — File
// nesnesi doğrudan yüklenir.
// Not: Bucket private (bkz. mobil src/lib/api/athletes.ts) — herkese açık
// URL (getPublicUrl) private bucket'ta erişilemeyen bir link döner, bu
// yüzden mobille aynı şekilde ~10 yıllık imzalı URL üretiyoruz.
export async function uploadAthletePhoto(athleteId: string, file: File): Promise<string> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const path = `${athleteId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("athlete-photos")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data, error: signError } = await supabase.storage.from("athlete-photos").createSignedUrl(path, 315360000);
  if (signError || !data) throw signError ?? new Error("İmzalı URL oluşturulamadı");
  return data.signedUrl;
}

export type LinkedUser = { id: string; name: string; email: string | null };

// Bir sporcu kaydının hangi giriş hesabına (Sporcu rolündeki bir
// kullanıcıya) bağlı olduğunu döner — yoksa null. Veli bağlantısı
// (parent_user_id) bundan ayrı ve bağımsızdır; bir sporcunun ikisi de
// aynı anda olabilir.
export async function getLinkedUser(athleteId: string): Promise<LinkedUser | null> {
  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("athlete_user_id")
    .eq("id", athleteId)
    .single();
  if (error) throw error;
  if (!athlete?.athlete_user_id) return null;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", athlete.athlete_user_id)
    .single();
  if (userError) throw userError;
  return user;
}

// Henüz herhangi bir sporcu kaydına bağlanmamış, "Sporcu" rolündeki
// kullanıcı hesaplarını listeler — bağlama seçicisi için.
export async function listUnlinkedAthleteUsers(): Promise<LinkedUser[]> {
  const [{ data: users, error: usersError }, { data: linked, error: linkedError }] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("role", "athlete").eq("is_active", true),
    supabase.from("athletes").select("athlete_user_id").not("athlete_user_id", "is", null),
  ]);
  if (usersError) throw usersError;
  if (linkedError) throw linkedError;

  const linkedIds = new Set((linked ?? []).map((r) => r.athlete_user_id));
  return (users ?? []).filter((u) => !linkedIds.has(u.id));
}

// Bir sporcu kaydını kendi giriş hesabına bağlar (ya da userId=null ile
// bağlantıyı kaldırır). Veli bağlantısına dokunmaz.
export async function linkAthleteAccount(athleteId: string, userId: string | null) {
  const { error } = await supabase.from("athletes").update({ athlete_user_id: userId }).eq("id", athleteId);
  if (error) throw error;
}

// getLinkedUser'ın veli (parent_user_id) karşılığı.
export async function getLinkedParentUser(athleteId: string): Promise<LinkedUser | null> {
  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("parent_user_id")
    .eq("id", athleteId)
    .single();
  if (error) throw error;
  if (!athlete?.parent_user_id) return null;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", athlete.parent_user_id)
    .single();
  if (userError) throw userError;
  return user;
}

// "Veli" rolündeki TÜM aktif hesapları listeler. listUnlinkedAthleteUsers'dan
// farklı olarak burada "bağlanmamış" filtresi YOK — aynı veli hesabı
// kardeşler için birden fazla sporcu kaydına bağlanabilmeli.
export async function listParentUsers(): Promise<LinkedUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("role", "parent")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// linkAthleteAccount'ın veli karşılığı — sporcu bağlantısına dokunmaz.
export async function linkParentAccount(athleteId: string, userId: string | null) {
  const { error } = await supabase.from("athletes").update({ parent_user_id: userId }).eq("id", athleteId);
  if (error) throw error;
}

export type AthleteGroupInfo = { group_id: string; group_name: string; branch: string };

// Sporcunun EK (birincil grubu dışındaki) branş/grup kayıtlarını döner.
export async function getAthleteExtraGroups(athleteId: string): Promise<AthleteGroupInfo[]> {
  const { data, error } = await supabase
    .from("athlete_groups")
    .select("group_id, groups(name, branch)")
    .eq("athlete_id", athleteId);
  if (error) throw error;
  return ((data as any[]) ?? []).map((r) => ({
    group_id: r.group_id, group_name: r.groups?.name ?? "?", branch: r.groups?.branch ?? "?",
  }));
}

// Sporcunun ek grup listesini TAMAMEN yeniden yazar (birincil grup hariç).
export async function setAthleteExtraGroups(athleteId: string, groupIds: string[]) {
  const { error: delError } = await supabase.from("athlete_groups").delete().eq("athlete_id", athleteId);
  if (delError) throw delError;
  if (groupIds.length === 0) return;
  const { error: insError } = await supabase
    .from("athlete_groups")
    .insert(groupIds.map((group_id) => ({ athlete_id: athleteId, group_id })));
  if (insError) throw insError;
}
