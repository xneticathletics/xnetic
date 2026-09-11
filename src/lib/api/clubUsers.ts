import { supabase } from "../supabase";
import type { UserRole } from "../../context/AuthContext";
import { assertRowAffected } from "./assertAffected";

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

// Bir hesap silme talebini işleme almak için — kalıcı silme değil,
// erişimi tamamen kapatır (custom_access_token_hook is_active=false gören
// bir hesabın rol/kulüp claim'lerini boşaltıyor, bkz. güvenlik denetimi
// notları). Kalıcı veri silme/anonimleştirme KVKK sürecine göre ayrıca
// ele alınmalı, bu fonksiyonun kapsamında değil.
export async function deactivateUser(userId: string): Promise<void> {
  const { data, error } = await supabase.from("users").update({ is_active: false }).eq("id", userId).select("id");
  if (error) throw error;
  assertRowAffected(data);
}
