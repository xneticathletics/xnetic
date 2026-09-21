// supabase/functions/purge-storage-queue/index.ts
//
// pg_cron (trigger_storage_purge, 10 dakikada bir) tarafından tetiklenir.
// Silinen kayıtların (sporcu, kullanıcı, etkinlik, ürün, antrenman, PDF,
// dekont) bıraktığı Storage dosyalarını, storage_purge_queue kuyruğundan
// okuyup Storage API ile siler. Girdi almaz — yalnızca kuyruğu boşaltır,
// bu yüzden verify_jwt=false ile anon anahtarıyla çağrılması zararsızdır.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH = 200;
const MAX_ATTEMPTS = 5;

type QueueRow = { id: number; bucket: string; path: string; is_file: boolean; attempts: number };

// Klasör altındaki tüm dosyaları (bir alt seviye dahil) siler.
async function purgePrefix(admin: any, bucket: string, prefix: string): Promise<void> {
  const { data: entries, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  const files: string[] = [];
  for (const e of entries ?? []) {
    if (e.id === null) {
      const { data: sub } = await admin.storage.from(bucket).list(`${prefix}/${e.name}`, { limit: 1000 });
      for (const s of sub ?? []) files.push(`${prefix}/${e.name}/${s.name}`);
    } else {
      files.push(`${prefix}/${e.name}`);
    }
  }
  if (files.length > 0) {
    const { error: removeError } = await admin.storage.from(bucket).remove(files);
    if (removeError) throw removeError;
  }
}

Deno.serve(async (_req) => {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: rows, error } = await admin
      .from("storage_purge_queue")
      .select("id, bucket, path, is_file, attempts")
      .order("id", { ascending: true })
      .limit(BATCH);
    if (error) throw error;

    let done = 0;
    let failed = 0;
    for (const row of (rows ?? []) as QueueRow[]) {
      try {
        if (row.is_file) {
          const { error: removeError } = await admin.storage.from(row.bucket).remove([row.path]);
          if (removeError) throw removeError;
        } else {
          await purgePrefix(admin, row.bucket, row.path);
        }
        await admin.from("storage_purge_queue").delete().eq("id", row.id);
        done++;
      } catch (_e) {
        failed++;
        if (row.attempts + 1 >= MAX_ATTEMPTS) {
          await admin.from("storage_purge_queue").delete().eq("id", row.id);
        } else {
          await admin.from("storage_purge_queue").update({ attempts: row.attempts + 1 }).eq("id", row.id);
        }
      }
    }

    return new Response(JSON.stringify({ done, failed }), {
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
