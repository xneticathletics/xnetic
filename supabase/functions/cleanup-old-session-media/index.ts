// supabase/functions/cleanup-old-session-media/index.ts
//
// Günlük pg_cron görevi (trigger_session_media_cleanup, bkz. migration
// 20260908080000) tarafından tetiklenir. Antrenman fotoğrafları bir yük
// oluşturmasın diye 2 haftadan eski olanlar hem Storage'dan hem
// veritabanından siliniyor. Bunun bir Edge Function olmasının sebebi:
// SQL'den doğrudan "delete from storage.objects" çalıştırmak sadece
// kataloğu temizler, arkadaki gerçek dosyayı silmez — gerçek silme
// SADECE Storage API/SDK'nın .remove() çağrısıyla oluyor (delete-club
// fonksiyonundaki service-role client deseniyle aynı).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RETENTION_DAYS = 14;

Deno.serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await admin
      .from("training_session_media")
      .select("id, storage_path")
      .lt("created_at", cutoff);
    if (error) throw error;

    const paths = (rows ?? []).map((r: { storage_path: string | null }) => r.storage_path).filter((p): p is string => !!p);
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from("session-media").remove(paths);
      if (removeError) throw removeError;
    }

    const ids = (rows ?? []).map((r: { id: string }) => r.id);
    if (ids.length > 0) {
      const { error: deleteError } = await admin.from("training_session_media").delete().in("id", ids);
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
