// supabase/functions/cleanup-old-social-posts/index.ts
//
// Günlük pg_cron görevi (trigger_social_posts_cleanup, bkz. migration
// 20260909050000) tarafından tetiklenir. Sosyal Alan paylaşımları (foto/
// video, pending/approved ayrımı yok) bir yük oluşturmasın diye 2 haftadan
// eski olanlar hem Storage'dan hem veritabanından siliniyor. Bunun bir
// Edge Function olmasının sebebi: SQL'den doğrudan "delete from
// storage.objects" çalıştırmak sadece kataloğu temizler, arkadaki gerçek
// dosyayı silmez — gerçek silme SADECE Storage API/SDK'nın .remove()
// çağrısıyla oluyor (cleanup-old-session-media'daki service-role client
// deseniyle aynı). Duyurulardan farklı olarak burada kulüp bazlı
// yapılandırılabilir bir süre YOK — sabit 14 gün.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RETENTION_DAYS = 14;

Deno.serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await admin
      .from("social_posts")
      .select("id, storage_path")
      .lt("created_at", cutoff);
    if (error) throw error;

    // Fotoğraflarda ana dosyanın yanında AYRICA küçük bir ızgara önizlemesi
    // de var (bkz. src/lib/api/socialPosts.ts thumbPathFor) — ayrı bir
    // sütunda izlenmiyor, ana yoldan deterministik türetiliyor. Video
    // paylaşımlarda böyle bir dosya hiç yok, ama nonexistent bir path'i
    // remove etmek hata vermiyor (idempotent), o yüzden ayrıca kontrol yok.
    const thumbPathFor = (path: string): string => {
      const dot = path.lastIndexOf(".");
      return dot === -1 ? `${path}_thumb` : `${path.slice(0, dot)}_thumb${path.slice(dot)}`;
    };
    const mainPaths = (rows ?? []).map((r: { storage_path: string | null }) => r.storage_path).filter((p): p is string => !!p);
    const paths = mainPaths.flatMap((p) => [p, thumbPathFor(p)]);
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from("social-posts").remove(paths);
      if (removeError) throw removeError;
    }

    const ids = (rows ?? []).map((r: { id: string }) => r.id);
    if (ids.length > 0) {
      const { error: deleteError } = await admin.from("social_posts").delete().in("id", ids);
      if (deleteError) throw deleteError;
    }

    return new Response(JSON.stringify({ deleted: ids.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : "Bilinmeyen hata" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
