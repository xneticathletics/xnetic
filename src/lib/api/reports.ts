import { supabase } from "../supabase";

export type AttendanceReport = {
  present: number;
  total: number;
  ratePercent: number;
};

export type RatingReport = {
  count: number;
  average: number | null;
};

// Bir grubun belirli tarih aralığındaki katılım oranını hesaplar.
// Not: "Geldi" olarak işaretlenen kayıtlar / o aralıktaki toplam işaretlenen
// yoklama kaydı. AI yorum/öneri üretmez, yalnızca gerçek veriden sayı döner.
export async function getGroupAttendanceReport(
  groupId: string,
  dateFrom: string,
  dateTo: string
): Promise<AttendanceReport> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("group_id", groupId)
    .gte("session_date", dateFrom)
    .lte("session_date", dateTo);
  if (sessionsError) throw sessionsError;

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return { present: 0, total: 0, ratePercent: 0 };

  const { data: records, error: attendanceError } = await supabase
    .from("attendance")
    .select("status")
    .in("session_id", sessionIds);
  if (attendanceError) throw attendanceError;

  const total = records?.length ?? 0;
  const present = (records ?? []).filter((r) => r.status === "geldi").length;
  return { present, total, ratePercent: total ? Math.round((present / total) * 100) : 0 };
}

// Bir grubun belirli tarih aralığındaki antrenman değerlendirme (1-10)
// ortalamasını hesaplar. Puan girilmemiş antrenmanlar hesaba katılmaz.
export async function getGroupRatingReport(
  groupId: string,
  dateFrom: string,
  dateTo: string
): Promise<RatingReport> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("rating")
    .eq("group_id", groupId)
    .gte("session_date", dateFrom)
    .lte("session_date", dateTo)
    .not("rating", "is", null);
  if (error) throw error;

  const ratings = (data ?? []).map((d) => d.rating as number).filter((r) => r != null);
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return { count: ratings.length, average: average ? Math.round(average * 10) / 10 : null };
}

// Bugünün içinde bulunduğu haftanın Pazartesi–Pazar tarih aralığını döner.
export function getThisWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Pazar
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}

export function getThisMonthRange(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(first), to: fmt(last) };
}
