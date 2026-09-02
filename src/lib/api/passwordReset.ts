import * as Linking from "expo-linking";
import { supabase } from "../supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// "Şifremi Unuttum" ekranından çağrılır — Supabase, bu e-postaya bir
// sıfırlama linki gönderir. Link, DOĞRUDAN bu uygulamayı açar (bir web
// sayfası barındırmıyoruz — önceki denemede bu güvenilir çalışmamıştı).
export async function requestPasswordReset(email: string) {
  const redirectTo = Linking.createURL("reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

// Sıfırlama linkindeki "#access_token=...&refresh_token=...&type=recovery"
// parçasını ayrıştırır. URLSearchParams'a güvenmiyoruz (bazı React Native
// ortamlarında henüz tam desteklenmeyebiliyor) — kendi basit ayrıştırıcımız.
export function parseRecoveryUrl(url: string): { accessToken: string; refreshToken: string } | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;
  const hash = url.slice(hashIndex + 1);

  const params: Record<string, string> = {};
  hash.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
  });

  if (params.type !== "recovery" || !params.access_token || !params.refresh_token) return null;
  return { accessToken: params.access_token, refreshToken: params.refresh_token };
}

// Linkten gelen token'larla geçici bir "kurtarma oturumu" başlatır —
// bundan sonra kullanıcı yeni şifresini belirleyebilir.
export async function startRecoverySession(accessToken: string, refreshToken: string) {
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw error;
}

// Yeni Şifre Belirle ekranından çağrılır.
export async function completePasswordReset(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Telefon/kullanıcı adıyla açılmış hesaplar için Şifremi Unuttum
// ekranından çağrılır — bu kişinin GİRİŞ YAPMAMIŞ olduğu bir çağrı,
// oturum token'ı yok. Anon key'i Authorization Bearer olarak gönderiyoruz
// (Supabase Edge Functions'ın varsayılan JWT doğrulaması anon key'i de
// geçerli bir token olarak kabul eder). Eşleşme bulunsa da bulunmasa da
// fonksiyon her zaman aynı genel başarı yanıtını dönüyor — hesap
// numaralandırmasına karşı, burada da o davranışı koruyoruz.
export async function requestPasswordResetNotice(identifier: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/request-password-reset-notice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ identifier }),
  }).catch(() => {});
}

// Kulüp Ayarları → Kullanıcılar ekranındaki "Şifreyi Sıfırla" butonundan
// çağrılır — admin'in kendi oturum token'ıyla.
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
