// supabase/functions/invite-user/index.ts
//
// Eski davranış: supabase.auth.admin.inviteUserByEmail() ile e-posta
// gönderiyordu, kullanıcı linke tıklayıp ayrı bir web sayfasında şifre
// belirliyordu. O web sayfası (Supabase Storage'ın .html dosyalarını
// güvenlik amacıyla text/html olarak SUNMAMASI yüzünden) güvenilir
// çalıştırılamadı.
//
// Yeni davranış: Admin'in girdiği e-posta+rol ile DOĞRUDAN bir hesap
// oluşturulur, rastgele bir GEÇİCİ ŞİFRE üretilir ve yanıtta admin'e
// geri döndürülür — admin bunu kişiye elden/mesajla iletir. Kişi
// uygulamaya bu şifreyle giriş yapar, ilk girişte (must_change_password
// bayrağı sayesinde) zorunlu olarak kendi şifresini belirler.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTempPassword(): string {
  // Karışıklık yaratabilecek karakterleri (0/O, 1/l/I) çıkardık — admin
  // bunu sesli okuyup iletebilir diye.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

// Bu fonksiyonun birebir aynısı src/lib/loginIdentifier.ts içinde de
// duruyor (uygulama tarafı, giriş ekranı için) — buradan import
// edilemediği için (ayrı bir Deno ortamı) kasıtlı olarak kopya. Biri
// değişirse diğeri de değişmeli.
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Yetkilendirme bulunamadı.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Çağıranın gerçekten giriş yapmış bir kullanıcı olduğunu doğrula.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerAuthError } = await callerClient.auth.getUser();
    if (callerAuthError || !callerAuth.user) throw new Error("Geçersiz oturum.");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Çağıranın club_id + rolünü bul, sadece Admin davet edebilsin.
    const { data: callerRow, error: callerRowError } = await admin
      .from("users")
      .select("club_id, role")
      .eq("auth_user_id", callerAuth.user.id)
      .single();
    if (callerRowError || !callerRow) throw new Error("Kullanıcı bulunamadı.");
    if (callerRow.role !== "club_admin" && callerRow.role !== "super_admin") {
      throw new Error("Bu işlem için yetkiniz yok.");
    }

    const body = await req.json();
    const { identifier, role, name } = body;
    if (!identifier || !role) throw new Error("Telefon, kullanıcı adı ya da e-posta ve rol zorunludur.");

    // club_admin sadece kendi kulübü içindeki rolleri atayabilir — aksi
    // halde bir club_admin, role:"super_admin" göndererek platformun
    // tamamına erişim kazanan bir hesap yaratabilirdi. super_admin daveti
    // sadece mevcut bir super_admin tarafından yapılabilir.
    const INVITABLE_ROLES_BY_CLUB_ADMIN = ["club_admin", "coach", "parent", "athlete"];
    if (callerRow.role === "club_admin" && !INVITABLE_ROLES_BY_CLUB_ADMIN.includes(role)) {
      throw new Error("Bu rolü atama yetkiniz yok.");
    }

    const trimmedIdentifier = String(identifier).trim();
    const loginEmail = resolveLoginEmail(trimmedIdentifier);
    const tempPassword = generateTempPassword();

    // Auth kullanıcısını doğrudan (e-posta doğrulaması beklemeden) oluştur.
    // Telefon/kullanıcı adıyla davet edilenler için loginEmail, Auth'un
    // iç kimliği olarak kullanılan sentetik bir adres — kişiye hiç
    // gösterilmiyor, sadece girdiği telefon/kullanıcı adıyla giriş yapıyor.
    const { data: createdAuth, error: createError } = await admin.auth.admin.createUser({
      email: loginEmail,
      password: tempPassword,
      email_confirm: true,
    });
    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes("already been registered") || msg.includes("already registered") || msg.includes("already exists")) {
        throw new Error("Bu telefon numarası, kullanıcı adı veya e-posta ile zaten bir hesap var.");
      }
      throw createError;
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const placeholderName =
      trimmedName || (trimmedIdentifier.includes("@") ? trimmedIdentifier.split("@")[0] : trimmedIdentifier);

    const { data: newRow, error: insertError } = await admin
      .from("users")
      .insert({
        auth_user_id: createdAuth.user.id,
        club_id: callerRow.club_id,
        name: placeholderName,
        email: loginEmail,
        role,
        must_change_password: true,
        // Antrenör için ayrıca ilk-giriş bilgi tamamlama ekranı da açılsın.
        onboarding_completed: role === "coach" ? false : true,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ id: newRow.id, identifier: trimmedIdentifier, tempPassword }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
