// supabase/functions/send-password-reset-email/index.ts
//
// Gerçek e-postalı hesapların (club_admin/antrenör vb.) "Şifremi Unuttum"
// akışı — eskiden doğrudan supabase.auth.resetPasswordForEmail()
// çağrılıyordu, bu da Supabase'in test-amaçlı, ağır hız sınırlı ve
// kulübün kendi alan adından gelmeyen varsayılan e-posta gönderimini
// kullanıyordu. Artık linki kendimiz (admin.auth.admin.generateLink ile)
// üretip Resend üzerinden, xnetic.net'ten, Türkçe/markalı bir e-postayla
// gönderiyoruz.
//
// GİRİŞ YAPMAMIŞ biri tarafından çağrılır — bu yüzden servis-rol ile
// çalışır ve request-password-reset-notice/index.ts ile BİREBİR AYNI
// anti-numaralandırma davranışını korur: eşleşme bulunsa da bulunmasa da
// (hız sınırı dışında) her zaman aynı genel başarı yanıtı döner.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_FROM = "X-NETIC <destek@xnetic.net>";

// create-club/index.ts ve request-password-reset-notice/index.ts'teki
// checkRateLimit ile birebir aynı kasıtlı kopya (ayrı Deno ortamları).
async function checkRateLimit(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  identifier: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await admin
    .from("edge_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("identifier", identifier)
    .gte("created_at", windowStart);
  if ((count ?? 0) >= maxAttempts) return false;
  await admin.from("edge_rate_limits").insert({ bucket, identifier });
  return true;
}

function resetEmailHtml(actionLink: string, name: string): string {
  return `
  <div style="background-color:#10122A;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:420px;margin:0 auto;background-color:#1B1E3F;border-radius:16px;padding:32px 28px;">
      <p style="color:#FFC845;font-size:20px;font-weight:800;margin:0 0 24px;">X-NETIC</p>
      <p style="color:#F5F5F2;font-size:16px;line-height:24px;margin:0 0 8px;">Merhaba ${name},</p>
      <p style="color:#F5F5F2;font-size:14px;line-height:22px;margin:0 0 24px;">
        Hesabın için bir şifre sıfırlama talebi aldık. Aşağıdaki butona dokunarak yeni şifreni belirleyebilirsin.
      </p>
      <a href="${actionLink}" style="display:inline-block;background-color:#FFC845;color:#10122A;font-weight:800;font-size:14px;text-decoration:none;padding:14px 28px;border-radius:12px;">
        Şifremi Sıfırla
      </a>
      <p style="color:#8B8FB8;font-size:12px;line-height:18px;margin:28px 0 0;">
        Bu talebi sen yapmadıysan bu e-postayı görmezden gelebilirsin — şifren değişmeyecek.
      </p>
      <p style="color:#8B8FB8;font-size:11px;line-height:16px;margin:16px 0 0;word-break:break-all;">
        Buton çalışmazsa şu linki kopyalayıp tarayıcına yapıştırabilirsin:<br />${actionLink}
      </p>
    </div>
  </div>`;
}

async function sendViaResend(to: string, name: string, actionLink: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY tanımlı değil.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: "X-NETIC — Şifre Sıfırlama",
      html: resetEmailHtml(actionLink, name),
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Resend hata döndü (${response.status}): ${text}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  // request-password-reset-notice/index.ts ile aynı desen: hata dahil her
  // durumda aynı genel başarı yanıtı — tek çıkış noktası.
  const genericOk = () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const withinLimit = await checkRateLimit(admin, "send-password-reset-email", clientIp, 8, 60);
    if (!withinLimit) {
      return new Response(JSON.stringify({ error: "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar dene." }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const redirectTo = typeof body?.redirectTo === "string" ? body.redirectTo : undefined;
    if (!email || !email.includes("@")) return genericOk();

    const { data: matchedUser } = await admin
      .from("users")
      .select("id, name")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (matchedUser) {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (!linkError && linkData?.properties?.action_link) {
        await sendViaResend(email, matchedUser.name, linkData.properties.action_link).catch(() => {});
      }
    }

    return genericOk();
  } catch {
    return genericOk();
  }
});
