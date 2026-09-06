import { supabase } from "../supabase";
import { sendNotification } from "./notifications";
import { getCurrentAppUserId, getCurrentUserName, getCurrentClubId } from "./currentUser";
import type { UserRole } from "../../context/AuthContext";

// Apple'ın 5.1.1(v) kuralı, hesap oluşturmayı destekleyen uygulamaların
// uygulama İÇİNDEN başlatılan bir hesap silme yolu sunmasını istiyor —
// anlık/otomatik olmak zorunda değil. Bu yüzden burada gerçek bir silme
// YAPMIYORUZ; talebi ilgili admine bildirim olarak iletiyoruz, admin
// Kullanıcılar ekranından "Devre Dışı Bırak"a basarak işleme alıyor
// (kalıcı veri silme/anonimleştirme KVKK sürecine göre ayrıca ele alınır).
export async function requestAccountDeletion(role: UserRole | null): Promise<void> {
  if (role === "super_admin") {
    throw new Error("Süper admin hesabı için bu özellik kullanılamıyor.");
  }
  const myUserId = await getCurrentAppUserId();
  const myName = await getCurrentUserName();
  if (!myUserId) throw new Error("Oturum bulunamadı.");

  let recipients: string[] = [];
  if (role === "club_admin") {
    const { data } = await supabase.from("users").select("id").eq("role", "super_admin").eq("is_active", true);
    recipients = (data ?? []).map((u) => u.id);
  } else {
    const clubId = await getCurrentClubId();
    if (!clubId) throw new Error("Kulüp bulunamadı.");
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("club_id", clubId)
      .eq("role", "club_admin")
      .eq("is_active", true);
    recipients = (data ?? []).map((u) => u.id);
  }

  const title = "Hesap Silme Talebi";
  const body = `${myName ?? "Bir kullanıcı"} hesabının silinmesini talep etti.`;

  await Promise.all(
    recipients.map((id) =>
      sendNotification(id, title, body, "account_deletion_request", { requesterId: myUserId }).catch(() => {})
    )
  );
}
