import { supabase } from "../supabase";

export type AttendanceStatus = "geldi" | "gelmedi" | "gec_kaldi" | "raporlu" | "izinli";

export type RosterEntry = {
  athlete_id: string;
  full_name: string;
  photo_url: string | null;
  status: AttendanceStatus | null;
};

export async function getSessionRoster(sessionId: string, groupId: string): Promise<RosterEntry[]> {
  const { data: athletes, error: athErr } = await supabase
    .from("athletes")
    .select("id, full_name, photo_url")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("full_name", { ascending: true });
  if (athErr) throw athErr;

  const { data: existing, error: attErr } = await supabase
    .from("attendance")
    .select("athlete_id, status")
    .eq("session_id", sessionId);
  if (attErr) throw attErr;

  const statusMap = new Map<string, AttendanceStatus>(
    (existing ?? []).map((e) => [e.athlete_id as string, e.status as AttendanceStatus])
  );

  return (athletes ?? []).map((a) => ({
    athlete_id: a.id,
    full_name: a.full_name,
    photo_url: a.photo_url,
    status: statusMap.get(a.id) ?? null,
  }));
}

export async function saveAttendance(
  sessionId: string,
  entries: { athlete_id: string; status: AttendanceStatus }[]
) {
  const rows = entries.map((e) => ({ session_id: sessionId, athlete_id: e.athlete_id, status: e.status }));
  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "session_id,athlete_id" });
  if (error) throw error;
}
