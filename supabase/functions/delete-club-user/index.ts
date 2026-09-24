// supabase/functions/delete-club-user/index.ts
//
// Bir kulüp kullanıcısını (antrenör vb.) KALICI olarak siler — hem
// public.users satırını hem de auth.users kaydını.
//
// Neden gerekli: eskiden silme yalnızca istemciden public.users satırını
// kaldırıyordu, auth kaydı geride kalıyordu. Sonuçları canlıda görüldü:
// (1) aynı telefon/kullanıcı adıyla kişi TEKRAR OLUŞTURULAMIYOR ("bu kişi
// zaten var"), çünkü auth kaydı o giriş adresini tutmaya devam ediyor;
// (2) o kişi eski şifresiyle giriş yapabiliyor ama kulüp kaydı olmadığı
// için claim'leri boş geliyor ve uygulamada hiçbir şey göremiyor.
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
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerAuth, error: callerAuthError } = await callerClient.auth.getUser();
    if (callerAuthError || !callerAuth.user) throw new Error("Geçersiz oturum.");

    const { data: callerRow, error: callerRowError } = await admin
      .from("users")
      .select("id, role, club_id")
      .eq("auth_user_id", callerAuth.user.id)
      .maybeSingle();
    if (callerRowError || !callerRow) throw new Error("Kullanıcı bulunamadı.");
    if (callerRow.role !== "club_admin" && callerRow.role !== "super_admin") {
      throw new Error("Bu işlem için yetkiniz yok.");
    }

    const { userId } = await req.json();
    if (!userId) throw new Error("Kullanıcı belirtilmedi.");
    if (userId === callerRow.id) throw new Error("Kendi hesabını silemezsin.");

    const { data: targetRow, error: targetRowError } = await admin
      .from("users")
      .select("id, role, club_id, auth_user_id, name")
      .eq("id", userId)
      .maybeSingle();
    if (targetRowError || !targetRow) throw new Error("Kullanıcı bulunamadı.");

    // club_admin yalnızca KENDİ kulübündeki bir kullanıcıyı silebilir.
    if (callerRow.role === "club_admin" && targetRow.club_id !== callerRow.club_id) {
      throw new Error("Bu kullanıcı üzerinde yetkiniz yok.");
    }
    // super_admin'in erişebildiği tek kategori kulüp yöneticileridir —
    // gerçek bir kulübün antrenör/veli/sporcu kaydına dokunamaz
    // (admin-reset-user-password'daki aynı ilke).
    if (callerRow.role === "super_admin" && targetRow.role !== "club_admin") {
      throw new Error("Bu kullanıcı üzerinde yetkiniz yok.");
    }
    // Süper admin hesabı bu uçtan asla silinemez.
    if (targetRow.role === "super_admin") throw new Error("Bu hesap silinemez.");

    // Kulübün SON aktif yöneticisi silinemez — aksi halde kulüp yönetimsiz
    // kalırdı. Bu fonksiyon servis rolüyle çalıştığı için istemci tarafındaki
    // tetikleyiciye (users_protect_last_club_admin) takılmıyor, kontrol
    // burada ayrıca yapılıyor. Kulübün tamamı kapatılacaksa delete-club var.
    if (targetRow.role === "club_admin") {
      const { count } = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("club_id", targetRow.club_id)
        .eq("role", "club_admin")
        .eq("is_active", true)
        .neq("id", userId);
      if ((count ?? 0) === 0) {
        throw new Error("Kulübün tek yöneticisi silinemez. Önce başka bir yönetici ekle.");
      }
    }

    // Silmeyi engelleyecek bağlantıları önce temizle (FK kısıtlamaları).
    await admin.from("coach_branches").delete().eq("coach_id", userId);
    await admin.from("group_coaches").delete().eq("coach_id", userId);
    await admin.from("groups").update({ head_coach_id: null }).eq("head_coach_id", userId);

    const { error: deleteRowError } = await admin.from("users").delete().eq("id", userId);
    if (deleteRowError) {
      throw new Error(
        "Silinemedi — bu kişiye bağlı geçmiş kayıtlar olabilir. Bunun yerine 'Pasifleştir' kullanabilirsin."
      );
    }

    // Asıl düzeltme: giriş kaydını da sil, böylece aynı telefon/kullanıcı
    // adı yeniden kullanılabilir ve kişi eski şifresiyle giriş yapamaz.
    if (targetRow.auth_user_id) {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(targetRow.auth_user_id);
      // Kulüp kaydı zaten silindi; auth silinemezse işlemi hataya düşürmek
      // yerine bunu çağırana bildiriyoruz (sessizce yutmuyoruz).
      if (authDeleteError) {
        return new Response(
          JSON.stringify({
            success: true,
            authDeleted: false,
            warning:
              "Kulüp kaydı silindi ancak giriş hesabı kaldırılamadı. Aynı telefon/kullanıcı adıyla yeni kayıt açılamayabilir.",
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    await admin.from("audit_log").insert({
      actor_user_id: callerRow.id,
      actor_role: callerRow.role,
      club_id: targetRow.club_id,
      action: "user_deleted_permanently",
      details: { deletedUserId: userId, deletedName: targetRow.name, deletedRole: targetRow.role },
    }).then(() => {}, () => {});

    return new Response(JSON.stringify({ success: true, authDeleted: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
