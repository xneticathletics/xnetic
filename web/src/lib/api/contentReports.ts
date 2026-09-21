import { supabase } from "../supabase";

// Mobildeki src/lib/api/moderation.ts ile aynı tablo/RPC'ler (Apple 1.2 —
// kullanıcı içeriği şikayeti). Şikayeti yalnızca mobil uygulamadan gönderilir;
// web panelde yönetici görüntüler ve "İncelendi" işaretler.

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  inappropriate: "Uygunsuz içerik",
  harassment: "Taciz / zorbalık",
  spam: "Spam / istenmeyen içerik",
  other: "Diğer",
};

export const REPORT_TYPE_LABEL: Record<string, string> = {
  message: "Mesaj",
  social_post: "Sosyal paylaşım",
  user: "Kullanıcı",
};

export type ContentReport = {
  id: string;
  content_type: "message" | "social_post" | "user";
  content_snapshot: string | null;
  reason: ReportReason;
  details: string | null;
  status: "open" | "resolved";
  created_at: string;
  reporter_name: string;
  reported_name: string;
};

export async function listContentReports(): Promise<ContentReport[]> {
  const { data, error } = await supabase
    .from("content_reports")
    .select("id, content_type, content_snapshot, reason, details, status, created_at, reporter_id, reported_user_id")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id])));
  const nameById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: users } = await supabase.from("users").select("id, name").in("id", ids);
    (users ?? []).forEach((u: any) => nameById.set(u.id, u.name));
  }
  return rows.map((r) => ({
    id: r.id,
    content_type: r.content_type,
    content_snapshot: r.content_snapshot,
    reason: r.reason,
    details: r.details,
    status: r.status,
    created_at: r.created_at,
    reporter_name: nameById.get(r.reporter_id) ?? "—",
    reported_name: nameById.get(r.reported_user_id) ?? "—",
  }));
}

export async function resolveContentReport(id: string): Promise<void> {
  const { error } = await supabase.rpc("resolve_content_report", { p_id: id });
  if (error) throw error;
}
