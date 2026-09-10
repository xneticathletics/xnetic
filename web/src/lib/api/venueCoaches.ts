import { supabase } from "../supabase";

// "Salon yetkilisi" etiketi — ayrı bir rol değil, mevcut bir antrenöre
// belirli bir salon için "antrenman ekle" yetkisi açan basit bir işaret
// (bkz. migration 20260907050000, RLS kontrolü is_venue_authority()).
// Mobildeki src/lib/api/venueCoaches.ts ile aynı — web'de sadece admin
// tarafından yönetiliyor (getMyAuthorizedVenueIds web'e gerekmiyor, çünkü
// antrenörler web'e hiç giremiyor).
export async function getCoachVenueIds(coachId: string): Promise<string[]> {
  const { data, error } = await supabase.from("venue_coaches").select("venue_id").eq("coach_id", coachId);
  if (error) throw error;
  return (data ?? []).map((r) => r.venue_id);
}

export async function setCoachVenue(coachId: string, venueId: string, enabled: boolean): Promise<void> {
  if (enabled) {
    const { error } = await supabase.from("venue_coaches").insert({ coach_id: coachId, venue_id: venueId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("venue_coaches").delete().eq("coach_id", coachId).eq("venue_id", venueId);
    if (error) throw error;
  }
}
