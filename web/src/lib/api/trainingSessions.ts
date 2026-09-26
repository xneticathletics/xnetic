import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type SessionStatus = "planned" | "completed" | "cancelled";

export type TrainingSession = {
  id: string;
  group_id: string;
  venue_id: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  notes: string | null;
  status: SessionStatus;
  groups?: { name: string; branch: string } | null;
  venues?: { name: string } | null;
};

export type TrainingSessionInput = {
  group_id: string;
  venue_id: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  notes: string | null;
};

// PostgreSQL unique_violation kodu — aynı salon + gün + saat çakışması.
const VENUE_CONFLICT_CODE = "23505";
const VENUE_CONFLICT_MESSAGE =
  "Bu salon, seçilen gün ve saatte başka bir antrenmana ayrılmış. Farklı bir saat veya salon seçin.";

export async function listSessions(): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, group_id, venue_id, session_date, start_time, end_time, topic, notes, status, groups(name, branch), venues(name)"
    )
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data as unknown as TrainingSession[]) ?? [];
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Bir antrenman oluşturulunca grubun baş+yardımcı antrenörlerine, branş
// koordinatörüne ve gruptaki aktif sporcuların veli/kendi hesaplarına
// bildirim gider. Mobildeki src/lib/api/trainingSessions.ts ile birebir aynı.
async function notifySessionCreated(session: Pick<TrainingSession, "group_id" | "venue_id" | "session_date" | "start_time">) {
  try {
    const [groupResult, assistantResult, venueResult, athletesResult] = await Promise.all([
      supabase.from("groups").select("name, branch, head_coach_id").eq("id", session.group_id).single(),
      supabase.from("group_coaches").select("coach_id").eq("group_id", session.group_id),
      session.venue_id
        ? supabase.from("venues").select("name").eq("id", session.venue_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("athletes").select("parent_user_id, athlete_user_id").eq("group_id", session.group_id).eq("status", "active"),
    ]);
    if (groupResult.error || !groupResult.data) return;
    const group = groupResult.data;

    let coordinatorId: string | null = null;
    if (group.branch) {
      const { data: branchRow } = await supabase
        .from("branches")
        .select("coordinator_user_id")
        .eq("name", group.branch)
        .maybeSingle();
      coordinatorId = branchRow?.coordinator_user_id ?? null;
    }

    const recipients = new Set<string>();
    if (group.head_coach_id) recipients.add(group.head_coach_id);
    (assistantResult.data ?? []).forEach((r) => recipients.add(r.coach_id));
    if (coordinatorId) recipients.add(coordinatorId);
    (athletesResult.data ?? []).forEach((a) => {
      if (a.parent_user_id) recipients.add(a.parent_user_id);
      if (a.athlete_user_id) recipients.add(a.athlete_user_id);
    });
    if (recipients.size === 0) return;

    const venueName = (venueResult as { data: { name: string } | null }).data?.name;
    const title = "Yeni Antrenman";
    const body = `${group.name} için ${formatSessionDate(session.session_date)} tarihinde ${session.start_time.slice(0, 5)} antrenman planlandı.${venueName ? ` 🏟 ${venueName}` : ""}`;

    await Promise.all(Array.from(recipients).map((id) => sendNotification(id, title, body, "training_session").catch(() => {})));
  } catch {
    // Bildirim gönderimi antrenman oluşturmayı asla bloklamamalı.
  }
}

export async function createSession(input: TrainingSessionInput) {
  const { data, error } = await supabase.from("training_sessions").insert(input).select().single();
  if (error) {
    if (error.code === VENUE_CONFLICT_CODE) throw new Error(VENUE_CONFLICT_MESSAGE);
    throw error;
  }
  await notifySessionCreated(data as TrainingSession);
  return data;
}

export async function updateSession(id: string, input: TrainingSessionInput) {
  const { data, error } = await supabase.from("training_sessions").update(input).eq("id", id).select().single();
  if (error) {
    if (error.code === VENUE_CONFLICT_CODE) throw new Error(VENUE_CONFLICT_MESSAGE);
    throw error;
  }
  return data;
}

export async function completeSession(id: string) {
  const { error } = await supabase
    .from("training_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from("training_sessions").delete().eq("id", id);
  if (error) throw error;
}

// Mobildeki src/lib/api/trainingSessions.ts'teki aynı yardımcılar —
// AttendanceModal'ın geçmiş bir antrenmanı salt-önizleme göstermesi için
// (bkz. can_write_attendance RLS kuralı: pencere dışında admin dahil
// kimse yazamıyor, 2026-09-26).
type SessionTiming = Pick<TrainingSession, "session_date" | "start_time" | "end_time">;

function toDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`);
}

// Bitiş saati başlangıçtan küçük/eşitse (ör. 23:30 - 00:00), antrenman
// gece yarısını geçiyor demektir — bitiş, session_date'in ERTESİ günü
// olarak hesaplanmalı.
function toEndDateTime(session: SessionTiming): Date {
  const end = toDateTime(session.session_date, session.end_time);
  const start = toDateTime(session.session_date, session.start_time);
  if (end <= start) end.setDate(end.getDate() + 1);
  return end;
}

export function isAttendanceWindowOpen(
  session: SessionTiming,
  beforeMinutes: number = 15,
  afterMinutes: number = 15
): boolean {
  const start = toDateTime(session.session_date, session.start_time);
  const windowStart = new Date(start.getTime() - beforeMinutes * 60 * 1000);
  const windowEnd = new Date(start.getTime() + afterMinutes * 60 * 1000);
  const now = new Date();
  return now >= windowStart && now <= windowEnd;
}

// Bir antrenmanın süresi tamamen geçmiş mi.
export function isSessionPast(session: SessionTiming): boolean {
  const end = toEndDateTime(session);
  return new Date() > end;
}
