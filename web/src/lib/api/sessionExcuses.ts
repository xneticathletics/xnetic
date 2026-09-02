import { supabase } from "../supabase";

export type SessionExcuse = {
  id: string;
  session_id: string;
  athlete_id: string;
  reason: string;
  created_at: string;
};

// Yoklama ekranında, o antrenman için önceden "gelemeyeceğim" bildirimi
// gönderen sporcuları görmek için — mobildeki src/lib/api/sessionExcuses.ts
// getMyExcuse (kişi başına) yerine tüm antrenman için toplu okuma.
export async function listExcusesForSession(sessionId: string): Promise<SessionExcuse[]> {
  const { data, error } = await supabase
    .from("session_excuses")
    .select("id, session_id, athlete_id, reason, created_at")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}
