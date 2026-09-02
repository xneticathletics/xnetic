// supabase/functions/create-club/index.ts
//
// Store'dan indirip ödemesini tamamlayan yeni bir kulübün, HİÇBİR
// oturumu/hesabı olmadan kendi kulübünü ve ilk Kulüp Admini hesabını
// tek seferde oluşturmasını sağlar. invite-user'ın aksine çağıranın
// zaten bir hesabı olması gerekmez — bu fonksiyon tam olarak o ilk
// hesabı yaratmak için var (bkz. supabase/config.toml: verify_jwt=false).
//
// NOT: Ödeme doğrulaması henüz burada YAPILMIYOR (iyzico entegrasyonu
// hazır olunca eklenecek) — şimdilik istemci tarafında "mock" bir ödeme
// adımından sonra buraya gelinir, billingPeriod sadece kayıt altına
// alınır (club_subscriptions.status = 'mock_paid').

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  let createdAuthUserId: string | null = null;
  let createdClubId: string | null = null;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json();
    const { clubName, adminName, email, phone, password, billingPeriod } = body;

    if (!clubName || !String(clubName).trim()) throw new Error("Kulüp adı zorunludur.");
    if (!adminName || !String(adminName).trim()) throw new Error("Ad soyad zorunludur.");
    if (!email || !String(email).trim()) throw new Error("E-posta zorunludur.");
    if (!password || String(password).length < 6) throw new Error("Şifre en az 6 karakter olmalıdır.");
    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") throw new Error("Geçersiz plan seçimi.");

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

    const { error: userError } = await admin.from("users").insert({
      auth_user_id: createdAuth.user.id,
      club_id: club.id,
      name: String(adminName).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
      role: "club_admin",
      is_active: true,
      must_change_password: false,
      onboarding_completed: true,
    });
    if (userError) throw userError;

    // Abonelik kaydı — ileride gerçek iyzico entegrasyonu bu satırı
    // status/payment_reference alanlarıyla güncelleyecek (status='active'
    // olunca bu tutar platform gelirine sayılır — bkz. getPlatformStats).
    // Şimdilik 'mock_paid': gerçek para hareketi yok, gelir hesabına dahil edilmez.
    const amountTry = billingPeriod === "yearly" ? 9990 : 999;
    await admin.from("club_subscriptions").insert({
      club_id: club.id,
      billing_period: billingPeriod,
      status: "mock_paid",
      amount_try: amountTry,
    });

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
