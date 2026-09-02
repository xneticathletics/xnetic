// supabase/functions/admin-reset-user-password/index.ts
//
// Kulüp Ayarları → Kullanıcılar ekranındaki "Şifreyi Sıfırla" butonundan
// çağrılır. Şifresini unutan biri için admin, yeni bir GEÇİCİ ŞİFRE
// üretir ve bunu (invite-user'daki gibi) kişiye elden/mesajla iletir.
// Kişi bu şifreyle girince must_change_password sayesinde yine zorunlu
// olarak kendi şifresini belirler.

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
      .select("club_id, role")
      .eq("auth_user_id", callerAuth.user.id)
      .single();
    if (callerRowError || !callerRow) throw new Error("Kullanıcı bulunamadı.");
    if (callerRow.role !== "club_admin" && callerRow.role !== "super_admin") {
      throw new Error("Bu işlem için yetkiniz yok.");
    }

    const body = await req.json();
    const { userId } = body;
    if (!userId) throw new Error("Kullanıcı belirtilmedi.");

    const { data: targetRow, error: targetRowError } = await admin
      .from("users")
      .select("auth_user_id, club_id")
      .eq("id", userId)
      .single();
    if (targetRowError || !targetRow) throw new Error("Kullanıcı bulunamadı.");

    // club_admin sadece kendi kulübündeki bir kullanıcının şifresini
    // sıfırlayabilir — aksi halde başka bir kulübün hesabına erişebilirdi.
    if (callerRow.role === "club_admin" && targetRow.club_id !== callerRow.club_id) {
      throw new Error("Bu kullanıcı üzerinde yetkiniz yok.");
    }

    const tempPassword = generateTempPassword();
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(targetRow.auth_user_id, {
      password: tempPassword,
    });
    if (updateAuthError) throw updateAuthError;

    const { error: flagError } = await admin
      .from("users")
      .update({ must_change_password: true })
      .eq("id", userId);
    if (flagError) throw flagError;

    return new Response(JSON.stringify({ tempPassword }), {
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
