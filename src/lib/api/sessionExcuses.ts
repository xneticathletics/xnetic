import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type SessionExcuse = {
  id: string;
  session_id: string;
  athlete_id: string;
  reason: string;
  created_at: string;
};

export async function getMyExcuse(sessionId: string, athleteId: string): Promise<SessionExcuse | null> {
  const { data, error } = await supabase
    .from("session_excuses")
    .select("id, session_id, athlete_id, reason, created_at")
    .eq("session_id", sessionId)
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Bir antrenmanın bağlı olduğu grubun baş + yardımcı antrenörlerine
// "sporcu gelemeyecek" bildirimi gönderir.
async function notifyCoachesOfExcuse(sessionId: string, athleteName: string, reason: string) {
  const { data: session } = await supabase
    .from("training_sessions")
    .select("group_id, session_date")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return;

  const [headResult, assistantResult] = await Promise.all([
    supabase.from("groups").select("head_coach_id").eq("id", session.group_id).maybeSingle(),
    supabase.from("group_coaches").select("coach_id").eq("group_id", session.group_id),
  ]);

  const recipients = new Set<string>();
  if (headResult.data?.head_coach_id) recipients.add(headResult.data.head_coach_id);
  (assistantResult.data ?? []).forEach((r) => recipients.add(r.coach_id));

  const title = "Antrenmana Katılamayacak";
  const body = `${athleteName}, ${session.session_date} tarihli antrenmana katılamayacağını bildirdi: "${reason}"`;

  await Promise.all(
    Array.from(recipients).map((uid) => sendNotification(uid, title, body).catch(() => {}))
  );
}

// Sporcu "gelemeyeceğim" bildirimini kaydeder/günceller (aynı antrenman
// için tekrar gönderirse üzerine yazar) ve grubun antrenörlerine haber verir.
export async function submitExcuse(sessionId: string, athleteId: string, athleteName: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("session_excuses")
    .upsert(
      { session_id: sessionId, athlete_id: athleteId, reason, updated_at: new Date().toISOString() },
      { onConflict: "session_id,athlete_id" }
    );
  if (error) throw error;
  await notifyCoachesOfExcuse(sessionId, athleteName, reason);
}

export async function cancelExcuse(sessionId: string, athleteId: string): Promise<void> {
  const { error } = await supabase
    .from("session_excuses")
    .delete()
    .eq("session_id", sessionId)
    .eq("athlete_id", athleteId);
  if (error) throw error;
}
