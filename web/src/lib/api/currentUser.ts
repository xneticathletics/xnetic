import { supabase } from "../supabase";

// Web panelinin JWT'sinde yalnızca club_id/app_role claim'i var; bazı
// insert'lerde (ör. fitness_programs.created_by) users tablosundaki iç
// id'ye ihtiyaç duyulur. Mobildeki src/lib/api/currentUser.ts'in
// getCurrentAppUserId fonksiyonuyla aynı sorgu — web tarafında foto/dosya
// yükleme gibi mobile'a özgü kısımlara ihtiyaç olmadığı için sade tutuldu.
let cachedUserId: string | null | undefined;

export async function getCurrentAppUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authData.user.id)
    .single();
  if (error) throw error;

  const userId: string | null = data?.id ?? null;
  cachedUserId = userId;
  return userId;
}
