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

// PostgreSQL unique_violation kodu — 001_init_schema.sql'deki uq_venue_slot
// index'i (aynı salon + gün + saat) tetiklenince gelir.
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

export async function getSession(id: string): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, group_id, venue_id, session_date, start_time, end_time, topic, notes, status, rating, rating_note, groups(name), venues(name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as TrainingSession;
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
  const { data, error } = await supabase
    .from("training_sessions")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (error.code === VENUE_CONFLICT_CODE) throw new Error(VENUE_CONFLICT_MESSAGE);
    throw error;
  }
  return data;
}

export async function completeSession(id: string, rating?: number, ratingNote?: string) {
  const update: Record<string, unknown> = { status: "completed", completed_at: new Date().toISOString() };
  if (rating) update.rating = rating;
  if (ratingNote) update.rating_note = ratingNote;

  const { error } = await supabase.from("training_sessions").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from("training_sessions").delete().eq("id", id);
  if (error) throw error;
}

type SessionTiming = Pick<TrainingSession, "session_date" | "start_time" | "end_time">;

function toDateTime(dateStr: string, timeStr: string): Date {
  // Postgres "time" alanı "HH:MM:SS" formatında gelir; tarayıcı/RN'in
  // yerel saat diliminde ayrıştırması için "T" ile birleştiriyoruz.
  return new Date(`${dateStr}T${timeStr}`);
}

// Bitiş saati başlangıçtan küçük/eşitse (ör. 23:30 - 00:00), antrenman
// gece yarısını geçiyor demektir — bitiş, session_date'in ERTESİ günü
// olarak hesaplanmalı. Aksi halde bitiş, başlangıçtan önceki bir ana denk
// gelip antrenman oluşturulur oluşturulmaz "süresi geçmiş" görünüyordu.
function toEndDateTime(session: SessionTiming): Date {
  const end = toDateTime(session.session_date, session.end_time);
  const start = toDateTime(session.session_date, session.start_time);
  if (end <= start) end.setDate(end.getDate() + 1);
  return end;
}

// "Yoklama Al" butonu, antrenman başlangıcından (varsayılan 15 dk önce
// ile 15 dk sonrası arasında) aktif olsun — bu dakikalar artık Profil →
// Gelişmiş Ayarlar'dan değiştirilebilir, aramayan taraf varsayılanı kullanır.
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

// "Antrenmanı Tamamlandı İşaretle" butonu, bitişe (varsayılan) son 10
// dakika kalana kadar pasif kalsın.
export function isCompletionWindowOpen(session: SessionTiming, beforeMinutes: number = 10): boolean {
  const end = toEndDateTime(session);
  const windowStart = new Date(end.getTime() - beforeMinutes * 60 * 1000);
  return new Date() >= windowStart;
}

// Bir antrenmanın süresi tamamen geçmiş mi (silme butonunu göstermek için).
export function isSessionPast(session: SessionTiming): boolean {
  const end = toEndDateTime(session);
  return new Date() > end;
}

// "Algılanan Zorluk Derecesi" anketi, antrenman başladıktan (varsayılan) 30
// dakika sonra açılır (sporcu antrenmanı gerçekten yaşamadan doldurmasın
// diye) ve bitişinden (varsayılan) 2 saat sonrasına kadar açık kalır.
export function isRpeWindowOpen(
  session: SessionTiming,
  afterStartMinutes: number = 30,
  afterEndMinutes: number = 120
): boolean {
  const start = toDateTime(session.session_date, session.start_time);
  const end = toEndDateTime(session);
  const windowStart = new Date(start.getTime() + afterStartMinutes * 60 * 1000);
  const windowEnd = new Date(end.getTime() + afterEndMinutes * 60 * 1000);
  const now = new Date();
  return now >= windowStart && now <= windowEnd;
}

// Antrenman bitişinden belirli bir süre (varsayılan 15 dk) geçtiyse ve
// hâlâ "planned" durumdaysa, otomatik "Tamamlandı" yapılması gereken
// antrenmanları tespit eder. Gerçek bir arka plan görevi (cron) henüz
// kurulmadığı için bu kontrol, ekran her açıldığında/yenilendiğinde
// çalışır — pratikte çoğu durumda aynı sonucu verir.
export function shouldAutoComplete(
  session: SessionTiming & { status: string },
  afterMinutes: number = 15
): boolean {
  if (session.status !== "planned") return false;
  const end = toEndDateTime(session);
  const threshold = new Date(end.getTime() + afterMinutes * 60 * 1000);
  return new Date() >= threshold;
}

// Veli/Sporcu paneli için: bir grubun antrenman programını (salt okunur
// görüntüleme, aksiyon butonları olmadan) döner.
export async function listSessionsByGroup(groupId: string): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, group_id, venue_id, session_date, start_time, end_time, topic, notes, status, groups(name), venues(name)"
    )
    .eq("group_id", groupId)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data as unknown as TrainingSession[]) ?? [];
}

// Antrenör paneli için: birden çok grubun (antrenörün kendi gruplarının)
// antrenman programını tek sorguda döner.
export async function listSessionsForGroups(groupIds: string[]): Promise<TrainingSession[]> {
  if (groupIds.length === 0) return [];
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, group_id, venue_id, session_date, start_time, end_time, topic, notes, status, rating, rating_note, groups(name), venues(name)"
    )
    .in("group_id", groupIds)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data as unknown as TrainingSession[]) ?? [];
}
