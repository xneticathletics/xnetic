import { supabase } from "../supabase";

export type ClubSettings = {
  assistant_coach_limit: number;
  attendance_window_before_minutes: number;
  attendance_window_after_minutes: number;
  completion_window_before_minutes: number;
  auto_complete_after_minutes: number;
  payment_plan_months_ahead: number;
  announcement_home_preview_days: number;
  announcement_visibility_days: number;
  payment_overdue_grace_days: number;
  finance_period_start_day: number;
  // Ana Sayfa'da kulübün kullanmadığı, bu yüzden gizlenmiş ana başlıkların
  // (tile) key listesi — bkz. HomeScreen.tsx TILES_BY_ROLE. Listede
  // olmayan bir tile her zaman görünürdür (varsayılan: hepsi aktif).
  disabled_home_tiles: string[];
};

// Kulüp henüz hiç ayar kaydetmediyse (yeni kulüp, ya da migration'dan
// sonra ilk açılış) bu varsayılanlar kullanılır — koddaki eski sabit
// değerlerle birebir aynı, davranış değişmez.
export const DEFAULT_CLUB_SETTINGS: ClubSettings = {
  assistant_coach_limit: 2,
  attendance_window_before_minutes: 15,
  attendance_window_after_minutes: 15,
  completion_window_before_minutes: 10,
  auto_complete_after_minutes: 15,
  payment_plan_months_ahead: 3,
  announcement_home_preview_days: 1,
  announcement_visibility_days: 10,
  payment_overdue_grace_days: 0,
  finance_period_start_day: 1,
  disabled_home_tiles: [],
};

// club_id EXPLICIT olarak filtrelenir — RLS'e (".limit(1)") güvenmek Süper
// Admin için kırılıyordu: is_super_admin() RLS'te TÜM kulüpleri gördüğü
// için ".limit(1)" o an veritabanında hangi kulüp "ilk" geliyorsa onu
// (kendi kulübü olmadığı hâlde) döndürüyordu. Normal roller için club_id
// zaten JWT'den geldiği için bu her zaman doğru sonucu garanti eder.
export async function getClubSettings(clubId: string): Promise<ClubSettings> {
  const { data, error } = await supabase.from("club_settings").select("*").eq("club_id", clubId).maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_CLUB_SETTINGS;
  return {
    assistant_coach_limit: data.assistant_coach_limit,
    attendance_window_before_minutes: data.attendance_window_before_minutes,
    attendance_window_after_minutes: data.attendance_window_after_minutes,
    completion_window_before_minutes: data.completion_window_before_minutes,
    auto_complete_after_minutes: data.auto_complete_after_minutes,
    payment_plan_months_ahead: data.payment_plan_months_ahead,
    announcement_home_preview_days: data.announcement_home_preview_days,
    announcement_visibility_days: data.announcement_visibility_days,
    payment_overdue_grace_days: data.payment_overdue_grace_days,
    finance_period_start_day: data.finance_period_start_day,
    disabled_home_tiles: data.disabled_home_tiles ?? [],
  };
}

export async function updateClubSettings(clubId: string, input: ClubSettings) {
  const { error } = await supabase.from("club_settings").upsert({ ...input, club_id: clubId }, { onConflict: "club_id" });
  if (error) throw error;
}

// Kulübün adı — Ana Sayfa'da logonun yanında gösterilir.
export async function getClubName(clubId: string): Promise<string | null> {
  const { data, error } = await supabase.from("clubs").select("name").eq("id", clubId).maybeSingle();
  if (error) return null;
  return data?.name ?? null;
}

// Kulüp Logosu ekranından kulüp adını güncellemek için.
export async function updateClubName(clubId: string, name: string): Promise<void> {
  const { error } = await supabase.from("clubs").update({ name }).eq("id", clubId);
  if (error) throw error;
}

// Havale/EFT ile ödeme adımında veliye gösterilecek banka bilgisi (hesap
// adı + IBAN, ayrı ayrı) — Banka Bilgileri ekranından admin tarafından
// girilir, isteğe bağlı.
export type ClubBankInfo = { bankAccountName: string | null; bankIban: string | null };

export async function getClubBankInfo(clubId: string): Promise<ClubBankInfo> {
  const { data, error } = await supabase.from("clubs").select("bank_account_name, bank_iban").eq("id", clubId).maybeSingle();
  if (error) return { bankAccountName: null, bankIban: null };
  return { bankAccountName: data?.bank_account_name ?? null, bankIban: data?.bank_iban ?? null };
}

export async function updateClubBankInfo(clubId: string, bankAccountName: string, bankIban: string): Promise<void> {
  const { error } = await supabase
    .from("clubs")
    .update({ bank_account_name: bankAccountName, bank_iban: bankIban })
    .eq("id", clubId);
  if (error) throw error;
}
