import { supabase } from "../supabase";

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
  groups?: { name: string } | null;
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
      "id, group_id, venue_id, session_date, start_time, end_time, topic, notes, status, groups(name), venues(name)"
    )
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data as unknown as TrainingSession[]) ?? [];
}

export async function createSession(input: TrainingSessionInput) {
  const { data, error } = await supabase.from("training_sessions").insert(input).select().single();
  if (error) {
    if (error.code === VENUE_CONFLICT_CODE) throw new Error(VENUE_CONFLICT_MESSAGE);
    throw error;
  }
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
