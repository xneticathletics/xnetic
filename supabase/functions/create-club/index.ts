// supabase/functions/create-club/index.ts
//
// Store'dan indirip ödemesini tamamlayan yeni bir kulübün, HİÇBİR
// oturumu/hesabı olmadan kendi kulübünü ve ilk Kulüp Admini hesabını
// tek seferde oluşturmasını sağlar. invite-user'ın aksine çağıranın
// zaten bir hesabı olması gerekmez — bu fonksiyon tam olarak o ilk
// hesabı yaratmak için var (bkz. supabase/config.toml: verify_jwt=false).
//
// NOT: Ödeme doğrulaması henüz burada YAPILMIYOR (iyzico entegrasyonu
// hazır olunca eklenecek) — şimdilik istemci Havale/EFT talimatlarını
// gösterip "Ödemeyi Yaptım" dedikten sonra buraya gelinir, kayıt
// club_subscriptions.status = 'pending_review' ile açılır ve Süper
// Admin'e (kendi banka hesabından parayı kontrol edip) onaylaması için
// bildirim gider — bkz. SuperAdminSubscriptionsScreen.tsx.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kimlik doğrulaması gerektirmeyen bu uç nokta herkese açık — bot/otomatik
// tekrarlı çağrılarla sahte kulüp kaydı açıp Süper Admin'e bildirim/push
// yağdırmayı engellemek için IP başına basit bir hız sınırlaması. Aynı
// deseni request-password-reset-notice gibi diğer verify_jwt=false uç
// noktalara eklerken de birebir kopyalamak yeterli (bkz. proje geneli
// kasıtlı-kopya deseni, invite-user/resolveLoginEmail'de olduğu gibi).
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

// CreateClubPage bir CaptchaWidget render edip token'ı topluyordu ama
// createClub() çağrısına hiç iletmiyordu (token sadece sonraki signIn()
// çağrısında kullanılıyordu) — yani bu uç noktanın tek koruması IP başına
// hız sınırıydı. Bu fonksiyon admin.auth.admin.createUser() (service-role)
// kullandığı için Supabase'in Attack Protection/Turnstile entegrasyonu
// (sadece public GoTrue signup/signin uçlarını kapsıyor) buraya hiç
// uygulanmıyor — token'ı burada AYRICA, doğrudan Cloudflare'e karşı
// doğrulamak gerekiyor.
async function verifyCaptcha(token: string | undefined, remoteIp: string): Promise<boolean> {
  if (!token) return false;
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true; // secret tanımlı değilse (yerel/test ortamı) doğrulamayı atla
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
  });
  const json = await res.json().catch(() => ({ success: false }));
  return json.success === true;
}

// Push gönderimi best-effort: hatası ana akışı bozmamalı, bu yüzden
// await edilmeden fire-and-forget çağrılıyor.
function triggerPushNotification(supabaseUrl: string, notificationId: string) {
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}`, apikey: anonKey },
    body: JSON.stringify({ notification_id: notificationId }),
  }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  let createdAuthUserId: string | null = null;
  let createdClubId: string | null = null;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // IP başına saatte en fazla 5 deneme — gerçek bir kullanıcının birkaç
    // kez yanlış girip düzeltmesine yetecek kadar gevşek, bot spam'ini
    // engelleyecek kadar sıkı.
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const withinLimit = await checkRateLimit(admin, "create-club", clientIp, 5, 60);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar dene." }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const body = await req.json();
    const { clubName, adminName, email, phone, password, billingPeriod, consentAccepted, captchaToken } = body;

    const captchaOk = await verifyCaptcha(captchaToken, clientIp);
    if (!captchaOk) throw new Error("Doğrulama başarısız oldu. Lütfen tekrar dene.");

    if (!clubName || !String(clubName).trim()) throw new Error("Kulüp adı zorunludur.");
    if (!adminName || !String(adminName).trim()) throw new Error("Ad soyad zorunludur.");
    if (!email || !String(email).trim()) throw new Error("E-posta zorunludur.");
    if (!password || String(password).length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") throw new Error("Geçersiz plan seçimi.");
    if (consentAccepted !== true) throw new Error("KVKK Aydınlatma Metni ve Kullanım Şartları'nı kabul etmelisiniz.");

    // Bakım modu ve güncel fiyatlar — Süper Admin'in Sistem Ayarları'ndan
    // yönettiği tek satırlık platform ayarları. İstemci tarafındaki kontrolün
    // (CreateClubScreen) atlanıp bu fonksiyona doğrudan istek atılması
    // ihtimaline karşı bakım modu burada da doğrulanıyor.
    const { data: settings, error: settingsError } = await admin
      .from("platform_settings")
      .select("monthly_price_try, yearly_price_try, maintenance_mode")
      .eq("id", true)
      .single();
    if (settingsError) throw settingsError;
    if (settings.maintenance_mode) throw new Error("Uygulama şu anda bakımda. Lütfen daha sonra tekrar deneyin.");

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing) throw new Error("Bu e-posta adresiyle kayıtlı bir hesap zaten var.");

    const { data: club, error: clubError } = await admin
      .from("clubs")
      .insert({
        name: String(clubName).trim(),
        plan: "starter",
        contact_email: normalizedEmail,
        contact_phone: phone ? String(phone).trim() : null,
      })
      .select()
      .single();
    if (clubError) throw clubError;
    createdClubId = club.id;

    const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
    });
    if (authError) throw authError;
    createdAuthUserId = createdAuth.user.id;

    const { data: createdUser, error: userError } = await admin
      .from("users")
      .insert({
        auth_user_id: createdAuth.user.id,
        club_id: club.id,
        name: String(adminName).trim(),
        email: normalizedEmail,
        phone: phone ? String(phone).trim() : null,
        role: "club_admin",
        is_active: true,
        must_change_password: false,
        onboarding_completed: true,
      })
      .select("id")
      .single();
    if (userError) throw userError;

    // Formdaki tek onay kutusu, web/src/lib/consentTexts.ts'teki bölümlerin
    // (KVKK, foto/video, görev beyanı) TAMAMINI kapsıyor — mobildeki
    // ConsentScreen.tsx ile aynı consent_type anahtarları burada da tek
    // seferde kaydediliyor (kulüp admini mobil uygulamayı da açarsa tekrar
    // sorulmasın diye). "saglik" 2026-09-12'de kaldırıldı — artık sağlık
    // verisi hiç toplanmadığı için ayrı bir rıza maddesi de yok.
    await admin.from("user_consents").insert(
      ["kvkk", "foto_video", "sorumluluk"].map((consent_type) => ({ user_id: createdUser.id, consent_type }))
    );

    // Abonelik kaydı: 'pending_review' — Süper Admin havaleyi görüp
    // onaylayana kadar bu tutar platform gelirine sayılmaz (bkz.
    // getPlatformStats, sadece status='active' sayılıyor).
    const amountTry = billingPeriod === "yearly" ? settings.yearly_price_try : settings.monthly_price_try;
    await admin.from("club_subscriptions").insert({
      club_id: club.id,
      billing_period: billingPeriod,
      status: "pending_review",
      amount_try: amountTry,
    });

    // Süper adminlere "yeni bir kulüp ödeme bildirdi, kontrol et" bildirimi —
    // push da tetikler (bkz. send-push-notification).
    const { data: superAdmins } = await admin.from("users").select("id").eq("role", "super_admin").eq("is_active", true);
    if (superAdmins && superAdmins.length > 0) {
      const rows = superAdmins.map((a: { id: string }) => ({
        recipient_user_id: a.id,
        title: "Yeni Kulüp Ödemesi Bildirdi",
        body: `${club.name} kulübü ${billingPeriod === "yearly" ? "yıllık" : "aylık"} plan için ödeme yaptığını bildirdi. Abonelikler ekranından kontrol edip onaylayabilirsin.`,
        event_type: "subscription_alert",
      }));
      const { data: insertedRows } = await admin.from("notifications").insert(rows).select("id");
      insertedRows?.forEach((row: { id: string }) => triggerPushNotification(SUPABASE_URL, row.id));
    }

    return new Response(JSON.stringify({ success: true, clubId: club.id }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    // Yarım kalan kayıtları temizle (best-effort) — yoksa aynı e-posta
    // ile tekrar denemek "zaten kayıtlı" hatasına takılır.
    if (createdAuthUserId) {
      await createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
        .auth.admin.deleteUser(createdAuthUserId)
        .catch(() => {});
    }
    if (createdClubId) {
      await createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
        .from("clubs")
        .delete()
        .eq("id", createdClubId)
        .catch(() => {});
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
