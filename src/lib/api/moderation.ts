import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

// Apple 1.2 — kullanıcı içeriği: şikayet + engelleme. Yazmalar SECURITY
// DEFINER RPC'lerden geçer (bkz. 20260921100000_user_blocks_and_content_reports.sql).

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";
export type ReportContentType = "message" | "social_post" | "user";

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: "inappropriate", label: "Uygunsuz içerik" },
  { key: "harassment", label: "Taciz / zorbalık" },
  { key: "spam", label: "Spam / istenmeyen içerik" },
  { key: "other", label: "Diğer" },
];

export async function listBlockedIds(): Promise<{ byMe: Set<string>; me: Set<string> }> {
  const [mine, others] = await Promise.all([
    supabase.rpc("list_my_blocked_ids"),
    supabase.rpc("list_blocked_me_ids"),
  ]);
  return {
    byMe: new Set(((mine.data as string[] | null) ?? [])),
    me: new Set(((others.data as string[] | null) ?? [])),
  };
}

// Benim engellediklerim + beni engelleyenler — içerik gizlemek için tek küme.
// TEK RPC (list_hidden_user_ids): eskiden iki ayrı çağrı yapılıyordu, bu da
// her mesaj/kişi/akış yüklemesine fazladan bir ağ gidiş-dönüşü ekliyordu.
export async function listHiddenUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("list_hidden_user_ids");
  if (error) return new Set();
  return new Set(((data as string[] | null) ?? []));
}

export async function blockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("block_user", { p_user: userId });
  if (error) throw error;
}

export async function unblockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("unblock_user", { p_user: userId });
  if (error) throw error;
}

export async function reportContent(params: {
  type: ReportContentType;
  contentId?: string | null;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  snapshot?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("submit_content_report", {
    p_type: params.type,
    p_content_id: params.contentId ?? null,
    p_reported_user: params.reportedUserId,
    p_reason: params.reason,
    p_details: params.details?.trim() || null,
    p_snapshot: params.snapshot ?? null,
  });
  if (error) throw error;

  // Yöneticilere bildirim — best-effort, şikayetin kaydı zaten yapıldı.
  try {
    const { data } = await supabase.rpc("list_report_recipients");
    await Promise.all(
      ((data as string[] | null) ?? []).map((id) =>
        sendNotification(id, "Yeni Şikayet", "Bir içerik hakkında şikayet bildirildi. İncelemek için dokun.", "content_report").catch(() => {})
      )
    );
  } catch {}
}

export type ContentReport = {
  id: string;
  content_type: ReportContentType;
  content_id: string | null;
  content_snapshot: string | null;
  reason: ReportReason;
  details: string | null;
  status: "open" | "resolved";
  created_at: string;
  reporter_name: string;
  reported_user_id: string;
  reported_name: string;
};

export async function listContentReports(): Promise<ContentReport[]> {
  const { data, error } = await supabase
    .from("content_reports")
    .select("id, content_type, content_id, content_snapshot, reason, details, status, created_at, reporter_id, reported_user_id")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id])));
  const nameById = new Map<string, string>();
  if (ids.length) {
    const { data: users } = await supabase.from("users").select("id, name").in("id", ids);
    (users ?? []).forEach((u: any) => nameById.set(u.id, u.name));
  }
  return rows.map((r) => ({
    ...r,
    reporter_name: nameById.get(r.reporter_id) ?? "—",
    reported_name: nameById.get(r.reported_user_id) ?? "—",
  }));
}

export async function getOpenReportCount(): Promise<number> {
  const { count } = await supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open");
  return count ?? 0;
}

export async function resolveContentReport(id: string): Promise<void> {
  const { error } = await supabase.rpc("resolve_content_report", { p_id: id });
  if (error) throw error;
}
