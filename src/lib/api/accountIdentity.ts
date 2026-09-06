import { supabase } from "../supabase";
import { describeLoginIdentifier } from "../loginIdentifier";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Profil > Kişisel Bilgiler'de "Şu an şununla giriş yapıyorsun: ..."
// satırı için — sentetik adresi okunabilir telefon/kullanıcı adına çevirir.
export async function getCurrentLoginIdentifier(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return null;
  return describeLoginIdentifier(email);
}

// Kullanıcının kendi giriş bilgisini (telefon/kullanıcı adı/e-posta)
// değiştirmesi — update-login-identifier edge function'ı servis-rol ile
// hem Auth kimliğini hem public.users.email'i günceller.
export async function updateLoginIdentifier(identifier: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yap.");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/update-login-identifier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ identifier }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.error || `İstek başarısız oldu (kod: ${response.status}).`);
  }
}
