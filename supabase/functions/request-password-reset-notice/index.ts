// supabase/functions/request-password-reset-notice/index.ts
//
// Telefon/kullanıcı adıyla açılmış hesapların (gerçek e-postası olmadığı
// için Supabase'in kendi resetPasswordForEmail'i işe yaramayan) "Şifremi
// Unuttum" akışı. Bu fonksiyon GİRİŞ YAPMAMIŞ biri tarafından çağrılır —
// bu yüzden servis-rol ile RLS'yi bypass ediyoruz, ve hesap var mı yok mu
// bilgisini asla dışarı sızdırmıyoruz: eşleşme bulunsa da bulunmasa da
// HER ZAMAN aynı genel başarı yanıtını dönüyoruz.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bu fonksiyonun birebir aynısı src/lib/loginIdentifier.ts ve
// supabase/functions/invite-user/index.ts içinde de duruyor (ayrı Deno
// ortamları, import edilemiyor) — kasıtlı kopya, biri değişirse hepsi değişmeli.
const FAKE_LOGIN_DOMAIN = "xnetic.local";

function extractPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 0 && !digits.startsWith("0")) digits = `0${digits}`;
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
  if (!username) throw new Error("Geçerli bir telefon numarası veya kullanıcı adı gir.");
  return `usr${username}@${FAKE_LOGIN_DOMAIN}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  // Ne olursa olsun (hata dahil) hep aynı genel başarı yanıtını dönüyoruz
  // — numaralandırma saldırısına karşı, tek çıkış noktası.
  const genericOk = () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json();
    const identifier = String(body?.identifier ?? "").trim();
    if (!identifier) return genericOk();

    let loginEmail: string;
    try {
      loginEmail = resolveLoginEmail(identifier);
    } catch {
      return genericOk();
    }

    const { data: matchedUser } = await admin
      .from("users")
      .select("id, name, club_id")
      .eq("email", loginEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (matchedUser?.club_id) {
      const { data: admins } = await admin
        .from("users")
        .select("id")
        .eq("club_id", matchedUser.club_id)
        .eq("role", "club_admin")
        .eq("is_active", true);

      if (admins && admins.length > 0) {
        const rows = admins.map((a: { id: string }) => ({
          recipient_user_id: a.id,
          title: "Şifre Sıfırlama Talebi",
          body: `${matchedUser.name} (${identifier}) şifresini sıfırlamanı istiyor. Kullanıcılar ekranından yeni bir geçici şifre üretebilirsin.`,
          event_type: "password_reset_request",
          payload: { requesterId: matchedUser.id, requesterName: matchedUser.name, identifier },
        }));
        await admin.from("notifications").insert(rows);
      }
    }

    return genericOk();
  } catch {
    return genericOk();
  }
});
