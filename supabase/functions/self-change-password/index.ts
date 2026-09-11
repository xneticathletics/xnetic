// supabase/functions/self-change-password/index.ts
//
// İlk girişte zorunlu şifre değiştirme (ForcePasswordChangeScreen) için.
// Önceki akış (currentUser.ts changeMyPasswordFirstLogin): istemci önce
// supabase.auth.updateUser({password}) çağırıyor, SONRA ayrı bir çağrıyla
// users.must_change_password'ü kendi kendine false yapıyordu — ikinci
// adım RLS ile korunsa da (users_own_update), birinci adımı hiç
// çağırmadan doğrudan ikinci adımı (devtools/REST) tetiklemek serbestti,
// yani admin'in verdiği geçici şifre asla değiştirilmeden zorunlu
// rotasyon kalıcı olarak atlatılabiliyordu. Bu iki adımı TEK bir
// service-role çağrısında birleştiriyoruz: şifre gerçekten değişmeden
// must_change_password asla false olamaz.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { newPassword } = body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      throw new Error("Şifre en az 6 karakter olmalı.");
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerRow, error: callerRowError } = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", callerAuth.user.id)
      .single();
    if (callerRowError || !callerRow) throw new Error("Kullanıcı bulunamadı.");

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(callerAuth.user.id, {
      password: newPassword,
    });
    if (updateAuthError) throw updateAuthError;

    const { error: flagError } = await admin
      .from("users")
      .update({ must_change_password: false })
      .eq("id", callerRow.id);
    if (flagError) throw flagError;

    return new Response(JSON.stringify({ ok: true }), {
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
