import { supabase } from "../supabase";
import type { UserRole } from "../../context/AuthContext";

export type ClubUser = {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
};

// Kulüp Ayarları → Kullanıcılar sayfası için — kendi kulübündeki tüm
// (aktif) hesapları listeler. RLS zaten club_admin'i kendi kulübüyle
// sınırlıyor, bu yüzden burada manuel club_id filtresine gerek yok
// (mobildeki clubUsers.ts ile birebir aynı).
export async function listClubUsers(): Promise<ClubUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, phone")
    .eq("is_active", true)
    .order("role")
    .order("name");
  if (error) throw error;
  return (data as ClubUser[]) ?? [];
}
