import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type AttendanceStatus = "geldi" | "gelmedi" | "gec_kaldi" | "raporlu" | "izinli";

export type RosterEntry = {
  athlete_id: string;
  full_name: string;
  birth_date: string | null;
  photo_url: string | null;
  status: AttendanceStatus | null;
};

export async function getSessionRoster(sessionId: string, groupId: string): Promise<RosterEntry[]> {
  const { data: athletes, error: athErr } = await supabase
    .from("athletes")
    .select("id, full_name, birth_date, photo_url")
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
    birth_date: a.birth_date,
    photo_url: a.photo_url,
    status: statusMap.get(a.id) ?? null,
  }));
}

// Bir oturumda YENİ "gelmedi" işaretlenen sporcuların bağlı hesaplarına
// (veli VE/VEYA sporcunun kendi hesabı) anında bildirim gönderir. Mobildeki
// src/lib/api/attendance.ts ile birebir aynı davranış.
async function notifyAbsentAthletes(sessionId: string, athleteIds: string[]) {
  if (athleteIds.length === 0) return;

  const [{ data: session }, { data: athletes }] = await Promise.all([
    supabase.from("training_sessions").select("session_date").eq("id", sessionId).maybeSingle(),
    supabase.from("athletes").select("full_name, parent_user_id, athlete_user_id").in("id", athleteIds),
  ]);
  if (!session) return;

  const title = "Antrenmana Katılım";
  await Promise.all(
    (athletes ?? []).flatMap((a) => {
      const recipients = new Set<string>();
      if (a.parent_user_id) recipients.add(a.parent_user_id);
      if (a.athlete_user_id) recipients.add(a.athlete_user_id);
      const body = `${a.full_name}, ${session.session_date} tarihli antrenmana katılmadı olarak işaretlendi.`;
      return Array.from(recipients).map((uid) => sendNotification(uid, title, body, "absence").catch(() => {}));
    })
  );
}

// Bir sporcu ÜST ÜSTE (aynı grupta) 2. kez "gelmedi" işaretlenince, veli/
// sporcu hesabına VE grubun antrenörlerine ayrı, daha dikkat çekici (ama
// suçlayıcı olmayan) bir bildirim gönderir. Mobildeki aynı fonksiyonla
// birebir aynı davranış.
async function notifyConsecutiveAbsence(sessionId: string, newlyAbsentIds: string[]) {
  if (newlyAbsentIds.length === 0) return;

  const { data: session } = await supabase
    .from("training_sessions")
    .select("group_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session?.group_id) return;

  const { data: rows } = await supabase
    .from("attendance")
    .select("athlete_id, status, session_id, training_sessions!inner(session_date, start_time, group_id)")
    .in("athlete_id", newlyAbsentIds)
    .eq("training_sessions.group_id", session.group_id);
  if (!rows) return;

  const streakAthleteIds = newlyAbsentIds.filter((athleteId) => {
    const history = (rows as any[])
      .filter((r) => r.athlete_id === athleteId)
      .map((r) => ({
        status: r.status as AttendanceStatus,
        sortKey: `${r.training_sessions.session_date}${r.training_sessions.start_time}`,
      }))
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    // history[0] az önce "gelmedi" yazılan bu oturum, history[1] bu gruptaki bir önceki oturum.
    return history.length >= 2 && history[0].status === "gelmedi" && history[1].status === "gelmedi";
  });
  if (streakAthleteIds.length === 0) return;

  const [{ data: athletes }, { data: group }, { data: groupCoaches }] = await Promise.all([
    supabase.from("athletes").select("id, full_name, parent_user_id, athlete_user_id").in("id", streakAthleteIds),
    supabase.from("groups").select("head_coach_id").eq("id", session.group_id).maybeSingle(),
    supabase.from("group_coaches").select("coach_id").eq("group_id", session.group_id),
  ]);

  const coachIds = new Set<string>();
  if (group?.head_coach_id) coachIds.add(group.head_coach_id);
  (groupCoaches ?? []).forEach((c) => coachIds.add(c.coach_id));

  const title = "Devamsızlık Uyarısı";
  await Promise.all(
    (athletes ?? []).flatMap((a) => {
      const recipients = new Set<string>(coachIds);
      if (a.parent_user_id) recipients.add(a.parent_user_id);
      if (a.athlete_user_id) recipients.add(a.athlete_user_id);
      const body = `${a.full_name}, üst üste 2. antrenmana katılamadı. Bir engel varsa bizimle paylaşırsanız yardımcı olmaktan memnuniyet duyarız.`;
      return Array.from(recipients).map((uid) => sendNotification(uid, title, body, "consecutive_absence").catch(() => {}));
    })
  );
}

// attendance tablosundaki unique(session_id, athlete_id) sayesinde upsert
// güvenli şekilde "ekle veya güncelle" davranışı sağlar. Bildirim sadece
// durumu YENİ "gelmedi" olanlara gider — zaten "gelmedi" olarak kayıtlı bir
// sporcu tekrar kaydedilince spam bildirim gitmez. Mobildeki aynı fonksiyonla
// birebir aynı davranış.
export async function saveAttendance(
  sessionId: string,
  entries: { athlete_id: string; status: AttendanceStatus }[]
) {
  const { data: existing, error: existingError } = await supabase
    .from("attendance")
    .select("athlete_id, status")
    .eq("session_id", sessionId)
    .in("athlete_id", entries.map((e) => e.athlete_id));
  if (existingError) throw existingError;
  const previousStatus = new Map((existing ?? []).map((r) => [r.athlete_id, r.status as AttendanceStatus]));

  const rows = entries.map((e) => ({ session_id: sessionId, athlete_id: e.athlete_id, status: e.status }));
  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "session_id,athlete_id" });
  if (error) throw error;

  const newlyAbsentIds = entries
    .filter((e) => e.status === "gelmedi" && previousStatus.get(e.athlete_id) !== "gelmedi")
    .map((e) => e.athlete_id);
  await notifyAbsentAthletes(sessionId, newlyAbsentIds).catch(() => {});
  await notifyConsecutiveAbsence(sessionId, newlyAbsentIds).catch(() => {});
}
