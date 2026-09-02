import { supabase } from "../supabase";

// Bir sporcunun belirli bir antrenman için kendi girdiği RPE'yi döner
// (henüz girilmemişse null).
export async function getMyRpe(sessionId: string, athleteId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("session_rpe")
    .select("rpe")
    .eq("session_id", sessionId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (error) throw error;
  return data?.rpe ?? null;
}

// unique(session_id, athlete_id) sayesinde upsert ile "ekle veya güncelle".
export async function submitRpe(sessionId: string, athleteId: string, rpe: number) {
  const { error } = await supabase
    .from("session_rpe")
    .upsert({ session_id: sessionId, athlete_id: athleteId, rpe }, { onConflict: "session_id,athlete_id" });
  if (error) throw error;
}
