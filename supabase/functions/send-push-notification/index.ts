// supabase/functions/send-push-notification/index.ts
//
// notifications tablosuna bir satır eklendikten sonra (mobil/web
// sendNotification() ya da request-password-reset-notice gibi bir edge
// function tarafından) "best-effort, fire-and-forget" olarak çağrılır.
// Sadece bir notification_id alır, içeriği KENDİSİ okur — çağıranın
// keyfi title/body göndermesine izin vermez (verify_jwt=false olduğu için
// düşük güvenli bir uç nokta, en kötü ihtimalle var olan bir bildirimin
// push'unu tekrar tetikler, yeni içerik enjekte edemez).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { notification_id } = await req.json();
    if (!notification_id) throw new Error("notification_id zorunludur.");

    const { data: notif, error: notifError } = await admin
      .from("notifications")
      .select("recipient_user_id, title, body")
      .eq("id", notification_id)
      .single();
    if (notifError || !notif) throw new Error("Bildirim bulunamadı.");

    const { data: tokens, error: tokensError } = await admin
      .from("push_tokens")
      .select("id, expo_push_token")
      .eq("user_id", notif.recipient_user_id);
    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const messages = tokens.map((t) => ({
      to: t.expo_push_token,
      title: notif.title,
      body: notif.body,
      sound: "default",
    }));

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    const expoJson = await expoRes.json().catch(() => null);

    // Kaldırılmış/geçersiz cihaz token'larını (uygulama silinmiş, izin
    // kaldırılmış vb.) veritabanından temizle — Expo bunu "DeviceNotRegistered"
    // hatasıyla bildirir.
    const tickets: any[] = expoJson?.data ?? [];
    const invalidTokenIds = tickets
      .map((ticket, i) => (ticket?.details?.error === "DeviceNotRegistered" ? tokens[i].id : null))
      .filter((id): id is string => id !== null);

    if (invalidTokenIds.length > 0) {
      await admin.from("push_tokens").delete().in("id", invalidTokenIds);
    }

    return new Response(JSON.stringify({ success: true, sent: messages.length }), {
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
