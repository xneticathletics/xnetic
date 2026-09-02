import { supabase } from "../supabase";

export type InviteRole = "parent" | "athlete" | "coach";

export type InviteUserInput = {
  email: string;
  role: InviteRole;
};

export type InviteUserResult = {
  id: string;
  email: string;
  tempPassword: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// invite-user Edge Function'ını doğrudan fetch ile çağırıyoruz (mobildeki
// ile aynı sebep: supabase-js'in .functions.invoke() metodu hata
// durumunda gerçek hata mesajını kaybediyor).
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
