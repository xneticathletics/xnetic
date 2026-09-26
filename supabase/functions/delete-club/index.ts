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

// Denetim kaydı (audit_log) için — hem web hem mobil aynı Supabase
// projesinin arkasında olduğundan, Cloudflare/proxy zincirinin bıraktığı
// bu üç header'dan biri her zaman gerçek istemci IP'sini taşır.
function getRequestIp(req: Request): string | null {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

// clubs'a cascade FK'sı OLMAYAN, club_id kolonu taşıyan tablolar — 2026-09-05
// tarihli pg_constraint sorgusuyla doğrulanmış liste, 2026-09-26'da BİR
// KULÜP GERÇEKTEN SİLİNMEYE ÇALIŞILINCA "Bilinmeyen hata" ile başarısız
// olması üzerine yeniden tarandı ve 4 eksik tablo bulundu (events/
// event_registrations/training_schedule_templates/venue_coaches — hepsi
// clubs'a "NO ACTION" (yani engelleyen) bir FK ile bağlı, cascade DEĞİL;
// bu tablolarda satırı olan HER kulüp silme denemesi bu şekilde başarısız
// oluyordu). Yeni böyle bir tablo eklenirse burası da güncellenmeli (bkz.
// aynı isimde kontrol sorgusu: "select ... from pg_attribute ... where
// delete_rule is distinct from 'CASCADE'" — SET NULL olanlar (ör.
// audit_log) sorun değil, sadece NO ACTION/RESTRICT olanlar engelliyor).
const NON_CASCADING_CLUB_TABLES = [
  "coach_payments", // coach_payment_plans'tan ÖNCE silinmeli (FK bağımlılığı)
  "coach_payment_plans",
  "event_registrations", // events'ten ÖNCE silinmeli (FK bağımlılığı)
  "events",
  "expenses",
  "extra_income",
  "fitness_program_completions",
  "fitness_program_items",
  "fitness_programs",
  "fitness_groups", // fitness_group_members kendi ON DELETE CASCADE'i ile otomatik gider
  "fitness_measurements",
  "membership_freezes",
  "training_schedule_templates",
  "venue_coaches",
  "nutrition_articles",
  "performance_measurements",
  "wellness_checkins",
  "club_subscription_history",
];

// Storage'daki dosyalar clubs'a FK ile bağlı DEĞİL — kulüp satırı silinince
// fotoğraflar (sporcu/kullanıcı fotoğrafı, sosyal paylaşım, dekont, logo…)
// depoda kalmaya devam ediyordu; public bucket'lardakiler ise URL'i bilen
// herkese açık kalıyordu. KVKK/GDPR "silinme hakkı" için bu dosyalar da
// temizlenmeli. Yol şemaları bucket'a göre farklı (bazıları <clubId>/…,
// çoğu <entityId>/…) olduğundan ilgili id'ler silme işleminden ÖNCE
// toplanır.
type PurgePlan = { bucket: string; prefixes: string[] };

async function collectStoragePrefixes(admin: any, clubId: string): Promise<PurgePlan[]> {
  const ids = async (table: string, col = "id") => {
    const { data } = await admin.from(table).select(col).eq("club_id", clubId);
    return (data ?? []).map((r: Record<string, string>) => r[col]).filter(Boolean);
  };

  const [athletes, users, events, sessions, products, announcements] = await Promise.all([
    ids("athletes"), ids("users"), ids("events"), ids("training_sessions"), ids("shop_products"), ids("announcements"),
  ]);
  const { data: regs } = await admin.from("event_registrations").select("id").eq("club_id", clubId);
  const { data: pays } = await admin.from("payments").select("id").eq("club_id", clubId);

  return [
    { bucket: "club-logos", prefixes: [clubId] },
    { bucket: "social-posts", prefixes: [clubId] },
    { bucket: "athlete-photos", prefixes: athletes },
    { bucket: "user-photos", prefixes: users },
    { bucket: "event-banners", prefixes: events },
    { bucket: "event-receipts", prefixes: (regs ?? []).map((r: { id: string }) => r.id) },
    { bucket: "payment-receipts", prefixes: (pays ?? []).map((r: { id: string }) => r.id) },
    { bucket: "session-media", prefixes: sessions },
    { bucket: "shop-photos", prefixes: products },
    { bucket: "announcement-attachments", prefixes: announcements },
  ];
}

// Bir klasörün altındaki tüm dosyaları (bir alt seviye dahil) siler.
async function purgePrefix(admin: any, bucket: string, prefix: string): Promise<number> {
  const { data: entries } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!entries || entries.length === 0) return 0;

  const files: string[] = [];
  for (const e of entries) {
    // id === null => klasör (ör. social-posts/<clubId>/<postId>/)
    if (e.id === null) {
      const { data: sub } = await admin.storage.from(bucket).list(`${prefix}/${e.name}`, { limit: 1000 });
      for (const s of sub ?? []) files.push(`${prefix}/${e.name}/${s.name}`);
    } else {
      files.push(`${prefix}/${e.name}`);
    }
  }
  if (files.length === 0) return 0;
  await admin.storage.from(bucket).remove(files);
  return files.length;
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
      .select("id, role")
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

    // Denetim kaydı — silme işleminden ÖNCE (club_id anlamsızlaşmadan).
    await admin.from("audit_log").insert({
      actor_user_id: callerRow.id,
      actor_email: callerAuth.user.email,
      actor_role: callerRow.role,
      club_id: clubId,
      action: "club_deleted",
      target_type: "club",
      target_id: clubId,
      details: { clubName: club.name },
      ip_address: getRequestIp(req),
    });

    // 0. Storage yollarını, satırlar hâlâ dururken topla (silindikten sonra
    // hangi dosyanın kime ait olduğunu anlamak imkânsız).
    const purgePlan = await collectStoragePrefixes(admin, clubId).catch(() => [] as PurgePlan[]);

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

    // 4. Dosyaları temizle. Veri silme BAŞARIYLA bittikten sonra yapılır ve
    // hatası yutulur — storage tarafındaki bir sorun, tamamlanmış bir kulüp
    // silme işlemini asla geri alamaz/bloke edemez.
    let deletedFiles = 0;
    try {
      for (const { bucket, prefixes } of purgePlan) {
        for (const prefix of prefixes) {
          deletedFiles += await purgePrefix(admin, bucket, prefix).catch(() => 0);
        }
      }
    } catch {
      // yoksay — aşağıdaki yanıt yine de success döner
    }

    return new Response(JSON.stringify({ success: true, deletedFiles }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
