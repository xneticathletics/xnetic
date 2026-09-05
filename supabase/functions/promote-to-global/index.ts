// supabase/functions/promote-to-global/index.ts
//
// Süper Admin panelindeki "Globale Yükselt" butonundan çağrılır — bir
// kulübün eklediği fitness hareketi/besin/tarif/performans testini, o
// kulübün özel içeriğinden platform geneli (global, TÜM kulüplerin gördüğü)
// içeriğe çevirir: sadece club_id'yi null'a çeker. RLS bunu normal client'a
// izin vermiyor (UPDATE politikaları sadece club_id null OLAN satırları
// güncellemeye izin veriyor, club-özel bir satırı null'a çekmeye değil) —
// bu yüzden servis-rol ile burada yapılıyor.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sadece bu 4 tabloya izin ver — istemciden gelen bir tablo adını doğrudan
// SQL'e basmak (SQL injection/keyfi tablo erişimi) yerine izin listesi.
const ALLOWED_TABLES = ["fitness_exercises", "nutrition_foods", "nutrition_recipes", "performance_test_catalog"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

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
      .select("role")
      .eq("auth_user_id", callerAuth.user.id)
      .single();
    if (callerRowError || !callerRow) throw new Error("Kullanıcı bulunamadı.");
    if (callerRow.role !== "super_admin") throw new Error("Bu işlem için yetkiniz yok.");

    const body = await req.json();
    const { table, id } = body;
    if (!ALLOWED_TABLES.includes(table)) throw new Error("Geçersiz tablo.");
    if (!id) throw new Error("Kayıt belirtilmedi.");

    const { error: updateError } = await admin.from(table as AllowedTable).update({ club_id: null }).eq("id", id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
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
