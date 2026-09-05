// supabase/functions/delete-club/index.ts
//
// Süper Admin panelindeki "Kulübü Kalıcı Olarak Sil" butonundan çağrılır.
// Bir kulübü ve TÜM bağlı verisini (sporcular, antrenörler, veliler,
// yoklama, maç, ödeme, fitness/beslenme kayıtları — her şey) kalıcı olarak
// siler. Bunu doğrudan SQL ile yapmak riskli: (1) auth.users tablosuna
// normal client'lardan erişilemiyor, (2) bazı kulüp-özel tablolarda
// (fitness_groups, fitness_programs, membership_freezes, wellness_checkins
// vb.) clubs'a cascade FK'sı yok, elle silinmesi gerekiyor — bkz. 2026-09-05
// tarihli tam veritabanı temizliğinde yaşanan zorluk. Bu fonksiyon o
// deneyimden çıkan doğru/tam/tek-adımlı silme mantığını kalıcı hale getirir.
//
// Global (club_id NULL) içerik — fitness_exercises, nutrition_foods/
// recipes, performance_test_catalog — kesinlikle ETKİLENMEZ, sadece
// club_id eşleşen satırlar silinir.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// clubs'a cascade FK'sı OLMAYAN, club_id kolonu taşıyan tablolar — 2026-09-05
// tarihli pg_constraint sorgusuyla doğrulanmış tam liste. Yeni böyle bir
// tablo eklenirse burası da güncellenmeli (bkz. aynı isimde kontrol
// sorgusu: "select ... from pg_attribute ... where not in (select
// conrelid from pg_constraint where confrelid = clubs)").
const NON_CASCADING_CLUB_TABLES = [
  "coach_payments", // coach_payment_plans'tan ÖNCE silinmeli (FK bağımlılığı)
  "coach_payment_plans",
  "expenses",
  "extra_income",
  "fitness_program_completions",
  "fitness_program_items",
  "fitness_programs",
  "fitness_groups", // fitness_group_members kendi ON DELETE CASCADE'i ile otomatik gider
  "fitness_measurements",
  "membership_freezes",
  "nutrition_articles",
  "performance_measurements",
  "wellness_checkins",
  "club_subscription_history",
];

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
    const { clubId, confirmClubName } = body;
    if (!clubId) throw new Error("Kulüp belirtilmedi.");

    const { data: club, error: clubError } = await admin.from("clubs").select("id, name").eq("id", clubId).single();
    if (clubError || !club) throw new Error("Kulüp bulunamadı.");

    // Ek bir güvenlik katmanı: yanlışlıkla başka bir kulübü silmeyi
    // engellemek için çağıranın kulüp adını doğru yazması şart.
    if (!confirmClubName || confirmClubName.trim() !== club.name) {
      throw new Error("Kulüp adı eşleşmedi — onay metnini tam olarak yazmalısın.");
    }

    // 1. Bu kulübün kullanıcılarının auth hesaplarını sil (public.users
    // hâlâ dururken alt sorgu geçerli veriyi okur).
    const { data: clubUsers } = await admin.from("users").select("auth_user_id").eq("club_id", clubId);
    const authUserIds = (clubUsers ?? []).map((u: { auth_user_id: string }) => u.auth_user_id).filter(Boolean);
    for (const authUserId of authUserIds) {
      await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    }

    // 2. clubs'a cascade FK'sı olmayan tabloları elle temizle.
    for (const table of NON_CASCADING_CLUB_TABLES) {
      await admin.from(table).delete().eq("club_id", clubId);
    }

    // 3. clubs satırını sil — geri kalan CASCADE'li her şey (users,
    // athletes, groups, matches, training_sessions, messages,
    // notifications, payments, nutrition_foods/recipes,
    // performance_test_catalog, shop_*, venues, announcements,
    // club_settings, club_subscriptions, vb.) otomatik silinir.
    const { error: deleteClubError } = await admin.from("clubs").delete().eq("id", clubId);
    if (deleteClubError) throw deleteClubError;

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
