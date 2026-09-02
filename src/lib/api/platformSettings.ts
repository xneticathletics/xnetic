import { supabase } from "../supabase";

export type PlatformSettings = {
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportEmail: string | null;
  supportPhone: string | null;
};

// Tek satırlık platform-geneli ayarlar. RLS herkese (oturumsuz dahil)
// okuma izni veriyor — Kulüp Oluştur ekranı henüz giriş yapılmadan güncel
// fiyatı ve bakım durumunu göstermek zorunda; güncelleme sadece Süper Admin'e açık.
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("monthly_price_try, yearly_price_try, maintenance_mode, maintenance_message, support_email, support_phone")
    .eq("id", true)
    .single();
  if (error) throw error;
  return {
    monthlyPriceTry: data.monthly_price_try,
    yearlyPriceTry: data.yearly_price_try,
    maintenanceMode: data.maintenance_mode,
    maintenanceMessage: data.maintenance_message,
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
  };
}

export async function updatePlatformSettings(patch: Partial<PlatformSettings>): Promise<void> {
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.monthlyPriceTry !== undefined) dbPatch.monthly_price_try = patch.monthlyPriceTry;
  if (patch.yearlyPriceTry !== undefined) dbPatch.yearly_price_try = patch.yearlyPriceTry;
  if (patch.maintenanceMode !== undefined) dbPatch.maintenance_mode = patch.maintenanceMode;
  if (patch.maintenanceMessage !== undefined) dbPatch.maintenance_message = patch.maintenanceMessage;
  if (patch.supportEmail !== undefined) dbPatch.support_email = patch.supportEmail;
  if (patch.supportPhone !== undefined) dbPatch.support_phone = patch.supportPhone;

  const { error } = await supabase.from("platform_settings").update(dbPatch).eq("id", true);
  if (error) throw error;
}
