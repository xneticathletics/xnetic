// supabase/functions/bootstrap-super-admin/index.ts
//
// TEK SEFERLİK bir kurulum aracı: platformun ilk (ve tek) Süper Admin
// hesabını oluşturur. Kimse kendi kendine süper admin olamasın diye iki
// katmanlı korumalı: (1) SETUP_SECRET ortam değişkeniyle eşleşen bir
// sır gerektirir, (2) veritabanında zaten bir süper admin varsa çalışmayı
// reddeder — yani en fazla BİR kere gerçek bir hesap oluşturabilir.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SETUP_SECRET = Deno.env.get("SETUP_SECRET");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json();
    const { email, name, setupSecret } = body;

    if (!SETUP_SECRET || setupSecret !== SETUP_SECRET) throw new Error("Yetkisiz istek.");
    if (!email || !String(email).trim()) throw new Error("E-posta zorunludur.");

    const { count } = await admin.from("users").select("id", { count: "exact", head: true }).eq("role", "super_admin");
    if (count && count > 0) throw new Error("Zaten bir Süper Admin hesabı var.");

    const normalizedEmail = String(email).trim().toLowerCase();
    const tempPassword = generateTempPassword();

    const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
    });
    if (authError) throw authError;

    const { error: userError } = await admin.from("users").insert({
      auth_user_id: createdAuth.user.id,
      club_id: null,
      name: name?.trim() || "Süper Admin",
      email: normalizedEmail,
      role: "super_admin",
      is_active: true,
      must_change_password: true,
      onboarding_completed: true,
    });
    if (userError) {
      await admin.auth.admin.deleteUser(createdAuth.user.id).catch(() => {});
      throw userError;
    }

    return new Response(JSON.stringify({ email: normalizedEmail, tempPassword }), {
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
