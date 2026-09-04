import { supabase } from "../supabase";

export type PlatformSettings = {
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportEmail: string | null;
  supportPhone: string | null;
  bankAccountName: string | null;
  bankIban: string | null;
};

// Tek satırlık platform-geneli ayarlar. RLS herkese (oturumsuz dahil) okuma
// izni veriyor — Kulüp Oluştur sayfası henüz giriş yapılmadan güncel fiyatı,
// bakım durumunu VE ödeme için gereken banka bilgisini göstermek zorunda
// (mobildeki src/lib/api/platformSettings.ts ile birebir aynı — güncelleme
// burada yok, o Süper Admin panelinde kalıyor). bankAccountName/bankIban:
// X-NETIC'in kendi abonelik ödemelerini aldığı hesap.
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("monthly_price_try, yearly_price_try, maintenance_mode, maintenance_message, support_email, support_phone, bank_account_name, bank_iban")
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
    bankAccountName: data.bank_account_name,
    bankIban: data.bank_iban,
  };
}
