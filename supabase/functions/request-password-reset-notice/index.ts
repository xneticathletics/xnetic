// supabase/functions/request-password-reset-notice/index.ts
//
// "Şifremi Unuttum" ekranının TEK akışı: giriş yapmamış biri kullanıcı
// adını ya da telefon numarasını yazar, kulüp yöneticisine (yönetici kendi
// şifresini unuttuysa süper admine) bir "Şifre Sıfırlama Talebi" bildirimi
// gider, yönetici Kullanıcılar ekranından geçici şifre üretip iletir.
// E-posta linkiyle sıfırlama akışı uygulamadan kaldırıldı.
//
// Eşleştirme + bildirim gönderme mantığı public.request_password_reset_notice()
// SQL fonksiyonunda (bkz. 20260924030000 migration dosyası); burada yalnızca
// herkese açık uç noktanın hız sınırı ve hesap numaralandırmasına karşı
// HER ZAMAN aynı genel başarı yanıtı var.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kimlik doğrulaması gerektirmeyen bu uç nokta herkese açık — bot/otomatik
// tekrarlı çağrılarla kulüp admin(ler)ine sahte "şifre sıfırlama talebi"
// bildirim/push yağdırmayı engellemek için IP başına basit bir hız
// sınırlaması (create-club/index.ts'teki checkRateLimit ile birebir aynı
// kasıtlı kopya).
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

    // IP başına saatte en fazla 8 deneme (bu ekran gerçek bir kullanıcının
    // birkaç kez farklı format denemesi olağan olduğu için create-club'a
    // göre biraz daha gevşek).
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const withinLimit = await checkRateLimit(admin, "request-password-reset-notice", clientIp, 8, 60);
    if (!withinLimit) {
      return new Response(JSON.stringify({ error: "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar dene." }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const body = await req.json();
    const identifier = String(body?.identifier ?? "").trim();
    if (!identifier) return genericOk();

    // Eşleştirme (kullanıcı adı VEYA telefon) ve bildirim gönderimi tek bir
    // SECURITY DEFINER SQL fonksiyonunda; sonucu bilerek okumuyoruz.
    await admin.rpc("request_password_reset_notice", { p_identifier: identifier });

    return genericOk();
  } catch {
    return genericOk();
  }
});
