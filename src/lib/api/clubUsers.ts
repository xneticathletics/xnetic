import { supabase } from "../supabase";
import type { UserRole } from "../../context/AuthContext";

export type ClubUser = {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
};

// Kulüp Ayarları → Kullanıcılar ekranı için — kendi kulübündeki tüm
// (aktif) hesapları listeler. RLS zaten club_admin'i kendi kulübüyle
// sınırlıyor (listParentUsers/listUnlinkedAthleteUsers'da olduğu gibi),
// bu yüzden burada manuel club_id filtresine gerek yok.
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
