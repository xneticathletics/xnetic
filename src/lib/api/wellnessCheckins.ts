import { supabase } from "../supabase";

export type WellnessCheckin = {
  id: string;
  athlete_id: string;
  checkin_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  soreness: number | null;
  energy: number | null;
  mood: number | null;
  resting_hr: number | null;
  created_at: string;
};

export type WellnessCheckinInput = {
  athlete_id: string;
  checkin_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  soreness: number | null;
  energy: number | null;
  mood: number | null;
  resting_hr: number | null;
};

const FIELDS = "id, athlete_id, checkin_date, sleep_hours, sleep_quality, soreness, energy, mood, resting_hr, created_at";

// Bugünün (ya da herhangi bir günün) check-in kaydını oluşturur/günceller —
// aynı sporcu + aynı gün için tekrar kaydedilirse üzerine yazar (bkz.
// athlete_id+checkin_date unique kısıtı).
export async function upsertWellnessCheckin(input: WellnessCheckinInput) {
  const { data, error } = await supabase
    .from("wellness_checkins")
    .upsert(input, { onConflict: "athlete_id,checkin_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCheckinForDate(athleteId: string, date: string): Promise<WellnessCheckin | null> {
  const { data, error } = await supabase
    .from("wellness_checkins")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .eq("checkin_date", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Bir sporcunun son N günlük check-in geçmişi — hem kendi geçmişini
// görmesi hem antrenörün trend takibi için.
export async function listCheckinsForAthlete(athleteId: string, limit: number = 14): Promise<WellnessCheckin[]> {
  const { data, error } = await supabase
    .from("wellness_checkins")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .order("checkin_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type AthleteLatestCheckin = {
  athlete_id: string;
  full_name: string;
  photo_url: string | null;
  latest: WellnessCheckin | null;
};

// Verilen sporcu id listesindeki her sporcunun EN SON check-in kaydını
// döner — Antrenör'ün "Sporcu Check-in'leri" özet ekranı için.
export async function listLatestCheckinsForAthletes(athleteIds: string[]): Promise<AthleteLatestCheckin[]> {
  if (athleteIds.length === 0) return [];

  const [athletesResult, checkinsResult] = await Promise.all([
    supabase.from("athletes").select("id, full_name, photo_url").in("id", athleteIds),
    supabase
      .from("wellness_checkins")
      .select(FIELDS)
      .in("athlete_id", athleteIds)
      .order("checkin_date", { ascending: false }),
  ]);
  if (athletesResult.error) throw athletesResult.error;
  if (checkinsResult.error) throw checkinsResult.error;

  const latestByAthlete = new Map<string, WellnessCheckin>();
  (checkinsResult.data ?? []).forEach((c) => {
    if (!latestByAthlete.has(c.athlete_id)) latestByAthlete.set(c.athlete_id, c);
  });

  return (athletesResult.data ?? [])
    .map((a) => ({ athlete_id: a.id, full_name: a.full_name, photo_url: a.photo_url, latest: latestByAthlete.get(a.id) ?? null }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
}

// listLatestCheckinsForAthletes'ten farkı: her sporcunun EN SON kaydı
// yerine, verilen TARİHTEKİ kaydı döner (o gün doldurmadıysa null) —
// takvimden geçmiş bir günü seçip o günün check-in'lerini görmek için.
export async function listCheckinsForAthletesOnDate(athleteIds: string[], date: string): Promise<AthleteLatestCheckin[]> {
  if (athleteIds.length === 0) return [];

  const [athletesResult, checkinsResult] = await Promise.all([
    supabase.from("athletes").select("id, full_name, photo_url").in("id", athleteIds),
    supabase.from("wellness_checkins").select(FIELDS).in("athlete_id", athleteIds).eq("checkin_date", date),
  ]);
  if (athletesResult.error) throw athletesResult.error;
  if (checkinsResult.error) throw checkinsResult.error;

  const byAthlete = new Map<string, WellnessCheckin>((checkinsResult.data ?? []).map((c) => [c.athlete_id, c]));

  return (athletesResult.data ?? [])
    .map((a) => ({ athlete_id: a.id, full_name: a.full_name, photo_url: a.photo_url, latest: byAthlete.get(a.id) ?? null }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
}
