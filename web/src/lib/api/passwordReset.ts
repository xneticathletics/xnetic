import { supabase } from "../supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Kullanıcılar sayfasındaki "Şifreyi Sıfırla" butonundan çağrılır — admin'in
// kendi oturum token'ıyla, mobildeki aynı isimli fonksiyonla birebir aynı
// edge function'ı (admin-reset-user-password) kullanır.
export async function resetUserPassword(userId: string): Promise<{ tempPassword: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yap.");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-reset-user-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ userId }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error || `İstek başarısız oldu (kod: ${response.status}).`);
  }
  return json as { tempPassword: string };
}
