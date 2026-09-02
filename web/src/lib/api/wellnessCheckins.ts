import { supabase } from "../supabase";

// Sporcuların kendi doldurduğu günlük wellness anketi — mobildeki
// src/lib/api/wellnessCheckins.ts ile aynı "wellness_checkins" tablosu/
// kolonları. Web paneli salt-okunur bir liste sunuyor (bkz. AGENTS/görev
// kapsamı) — admin sadece kulüpteki TÜM sporcuların en güncel kayıtlarını
// görür, mobildeki gibi antrenöre özel grup filtresi yok.
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

const FIELDS = "id, athlete_id, checkin_date, sleep_hours, sleep_quality, soreness, energy, mood, resting_hr, created_at";

export type RecentCheckinRow = WellnessCheckin & {
  athlete_full_name: string;
  athlete_group_name: string | null;
};

// Kulüpteki en son check-in kayıtlarını (en yeni tarihten geriye, limit'e
// kadar) sporcu adı/grubu ile birlikte döner — DataTable için hazır satır.
export async function listRecentCheckins(limit: number = 200): Promise<RecentCheckinRow[]> {
  const { data, error } = await supabase
    .from("wellness_checkins")
    .select(`${FIELDS}, athletes!athlete_id(full_name, groups!group_id(name))`)
    .order("checkin_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    athlete_id: r.athlete_id,
    checkin_date: r.checkin_date,
    sleep_hours: r.sleep_hours,
    sleep_quality: r.sleep_quality,
    soreness: r.soreness,
    energy: r.energy,
    mood: r.mood,
    resting_hr: r.resting_hr,
    created_at: r.created_at,
    athlete_full_name: r.athletes?.full_name ?? "—",
    athlete_group_name: r.athletes?.groups?.name ?? null,
  }));
}
