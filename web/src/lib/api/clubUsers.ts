import { supabase } from "../supabase";
import { assertRowAffected } from "./assertAffected";
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
//
// SÜPER ADMİN HARİÇ: users RLS'i kulüp yöneticisinin süper admin satırını
// GÖRMESİNE bilerek izin veriyor (mesajlaşma/destek için gerekli, bkz.
// messages.ts), ama süper admin kulübün bir hesabı değil — bu listede
// çıkınca yanına "Şifreyi Sıfırla" düğmesi de geliyor ve platform
// sahibinin telefonu her kulüp yöneticisine görünüyordu (2026-09-24).
export async function listClubUsers(): Promise<ClubUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, phone")
    .eq("is_active", true)
    .neq("role", "super_admin")
    .order("role")
    .order("name");
  if (error) throw error;
  return (data as ClubUser[]) ?? [];
}

// "Yöneticilikten Çıkar" — hesabı pasifleştirir (kalıcı silme değil).
// Kulüp yöneticisi hesabı tek role sahip olduğu için yöneticiliği almak
// hesabı kapatmak demek; rol düşürmek artık mümkün değil (rol yalnızca
// hesap açılırken belirleniyor, bkz. users_block_role_change). Kulübün
// SON yöneticisi çıkarılamaz — sunucuda da korunuyor
// (users_protect_last_club_admin).
export async function deactivateUser(userId: string): Promise<void> {
  const { data, error } = await supabase.from("users").update({ is_active: false }).eq("id", userId).select("id");
  if (error) throw error;
  assertRowAffected(data);
}
