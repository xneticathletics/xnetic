import { supabase } from "../supabase";

export type InviteRole = "parent" | "athlete" | "coach";

export type InviteUserInput = {
  identifier: string;
  role: InviteRole;
  // Verilirse hesabın görünen adı olarak kullanılır (ör. formda zaten
  // girilmiş Ad Soyad) — verilmezse identifier'dan türetilen eski
  // davranışa (kullanıcı adı/telefonun kendisi) düşülür.
  name?: string;
};

export type InviteUserResult = {
  id: string;
  identifier: string;
  tempPassword: string;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// invite-user Edge Function'ını DOĞRUDAN fetch ile çağırıyoruz —
// supabase-js'in .functions.invoke() metodu, hata (non-2xx) durumunda
// yanıt gövdesini bir kere kendi içinde tüketip genel/anlamsız bir hata
// mesajı döndüren bilinen bir davranışa sahip (bkz. functions-js #55).
// Ham fetch ile yanıt gövdesini kendimiz okuyup gerçek hata mesajını
// güvenilir şekilde alabiliyoruz.
//
// Not: Artık e-posta daveti GÖNDERMİYOR — doğrudan geçici bir şifreyle
// hesap oluşturuyor, o şifreyi yanıtta geri döndürüyor. Admin bu şifreyi
// kişiye elden/mesajla iletir.
export async function inviteUser(input: InviteUserInput): Promise<InviteUserResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yap.");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(input),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || `İstek başarısız oldu (kod: ${response.status}).`);
  }

  return json as InviteUserResult;
}
