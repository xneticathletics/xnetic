import { supabase } from "./supabase";

export type PlatformSettings = {
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  supportEmail: string | null;
  supportPhone: string | null;
};

// Fiyatlandırma bölümünün, Süper Admin'in Sistem Ayarları'ndan girdiği
// güncel fiyatlarla her zaman uyumlu kalması için (yönetim panelindeki
// web/src/lib/api/platformSettings.ts ile aynı sorgu — RLS herkese
// oturumsuz okuma izni veriyor).
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("monthly_price_try, yearly_price_try, support_email, support_phone")
    .eq("id", true)
    .single();
  if (error) throw error;
  return {
    monthlyPriceTry: data.monthly_price_try,
    yearlyPriceTry: data.yearly_price_try,
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
  };
}
