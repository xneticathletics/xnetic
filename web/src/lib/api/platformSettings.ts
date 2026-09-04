import { supabase } from "../supabase";

export type PlatformSettings = {
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportEmail: string | null;
  supportPhone: string | null;
};

// Tek satırlık platform-geneli ayarlar. RLS herkese (oturumsuz dahil) okuma
// izni veriyor — Kulüp Oluştur sayfası henüz giriş yapılmadan güncel fiyatı
// ve bakım durumunu göstermek zorunda (mobildeki src/lib/api/platformSettings.ts
// ile birebir aynı — güncelleme burada yok, o Süper Admin panelinde kalıyor).
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
