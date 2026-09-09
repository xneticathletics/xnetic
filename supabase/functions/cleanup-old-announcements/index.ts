// supabase/functions/cleanup-old-announcements/index.ts
//
// Günlük pg_cron görevi (trigger_announcements_cleanup, bkz. migration
// 20260909040000) tarafından tetiklenir. Bir duyuru, kulübün KENDİ
// "Bildirim Ayarları > Duyuru Görünürlük Süresi" ayarına göre zaten
// kimseye görünmüyorsa (bkz. AnnouncementsScreen.tsx'teki client-side
// visibilityMs filtresi), veritabanında da saklanmasına gerek yok — hem
// satır hem varsa ek dosya (fotoğraf/video/belge) siliniyor. Her kulübün
// kendi süresi farklı olabildiği için tek bir sabit eşik yerine her
// duyuru KENDİ kulübünün ayarına göre değerlendiriliyor.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_VISIBILITY_DAYS = 10;

Deno.serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: announcements, error: annError } = await admin
      .from("announcements")
      .select("id, club_id, storage_path, created_at");
    if (annError) throw annError;
    if (!announcements || announcements.length === 0) {
      return new Response(JSON.stringify({ deleted: 0 }), { headers: { "Content-Type": "application/json" }, status: 200 });
    }

    const clubIds = [...new Set(announcements.map((a) => a.club_id))];
    const { data: settingsRows, error: settingsError } = await admin
      .from("club_settings")
      .select("club_id, announcement_visibility_days")
      .in("club_id", clubIds);
    if (settingsError) throw settingsError;

    const visibilityByClub = new Map<string, number>();
    (settingsRows ?? []).forEach((s: { club_id: string; announcement_visibility_days: number | null }) => {
      visibilityByClub.set(s.club_id, s.announcement_visibility_days ?? DEFAULT_VISIBILITY_DAYS);
    });

    const now = Date.now();
    const toDelete = announcements.filter((a) => {
      const days = visibilityByClub.get(a.club_id) ?? DEFAULT_VISIBILITY_DAYS;
      const ageMs = now - new Date(a.created_at).getTime();
      return ageMs > days * 24 * 60 * 60 * 1000;
    });

    const paths = toDelete.map((a) => a.storage_path).filter((p): p is string => !!p);
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from("announcement-attachments").remove(paths);
      if (removeError) throw removeError;
    }

    const ids = toDelete.map((a) => a.id);
    if (ids.length > 0) {
      const { error: deleteError } = await admin.from("announcements").delete().in("id", ids);
      if (deleteError) throw deleteError;
    }

    return new Response(JSON.stringify({ deleted: ids.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
