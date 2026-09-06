// supabase/functions/update-login-identifier/index.ts
//
// Kullanıcının kendi giriş bilgisini (telefon/kullanıcı adı/e-posta)
// Profil > Kişisel Bilgiler'den değiştirmesi için. auth.users.email
// (gerçek giriş kimliği) sadece admin API ile (email_confirm bypass
// edilerek) değiştirilebiliyor — istemci tarafından supabase.auth.
// updateUser({email}) çağrılırsa Supabase yeni adrese bir onay e-postası
// göndermeye çalışır, bu da sentetik (xnetic.local) adresler için hiç
// işe yaramaz. Bu yüzden invite-user'daki gibi servis-rol kullanıyoruz.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// invite-user/index.ts ve src/lib/loginIdentifier.ts ile birebir aynı
// kasıtlı kopya (ayrı Deno ortamı, import edilemiyor).
const FAKE_LOGIN_DOMAIN = "xnetic.local";

function extractPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length > 0 && !digits.startsWith("0")) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 11);
}

function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) throw new Error("Giriş bilgisi boş olamaz.");
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  const rawDigitCount = trimmed.replace(/\D/g, "").length;
  if (rawDigitCount >= 9) {
    return `tel${extractPhoneDigits(trimmed)}@${FAKE_LOGIN_DOMAIN}`;
  }

  const username = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!username) throw new Error("Geçerli bir telefon numarası, kullanıcı adı ya da e-posta gir.");
  return `usr${username}@${FAKE_LOGIN_DOMAIN}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Yetkilendirme bulunamadı.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerAuthError } = await callerClient.auth.getUser();
    if (callerAuthError || !callerAuth.user) throw new Error("Geçersiz oturum.");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerRow, error: callerRowError } = await admin
      .from("users")
      .select("id, email")
      .eq("auth_user_id", callerAuth.user.id)
      .single();
    if (callerRowError || !callerRow) throw new Error("Kullanıcı bulunamadı.");

    const body = await req.json();
    const identifier = String(body?.identifier ?? "").trim();
    if (!identifier) throw new Error("Telefon, kullanıcı adı ya da e-posta zorunludur.");

    const newLoginEmail = resolveLoginEmail(identifier);

    if (newLoginEmail === callerRow.email) {
      return new Response(JSON.stringify({ ok: true, unchanged: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("email", newLoginEmail)
      .neq("id", callerRow.id)
      .maybeSingle();
    if (existing) throw new Error("Bu telefon numarası, kullanıcı adı veya e-posta başka bir hesap tarafından kullanılıyor.");

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(callerAuth.user.id, {
      email: newLoginEmail,
      email_confirm: true,
    });
    if (updateAuthError) throw updateAuthError;

    const { error: updateRowError } = await admin.from("users").update({ email: newLoginEmail }).eq("id", callerRow.id);
    if (updateRowError) throw updateRowError;

    return new Response(JSON.stringify({ ok: true, identifier }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
