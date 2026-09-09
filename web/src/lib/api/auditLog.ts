import { supabase } from "../supabase";

export type AuditLogRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  club_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  clubs?: { name: string } | null;
};

// RLS zaten süper admin için tüm kayıtları, club_admin için sadece kendi
// kulübünün kayıtlarını döndürüyor (bkz. migration 20260909120000) —
// client'ta ekstra bir kulüp filtresine gerek yok.
export async function listAuditLog(limit = 200): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*, clubs(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as AuditLogRow[]) ?? [];
}
