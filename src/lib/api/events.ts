import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type EventType = "etkinlik" | "turnuva" | "kamp";
export type EventStatus = "draft" | "published" | "cancelled";
export type EventRegistrationStatus = "pending" | "approved" | "rejected" | "cancelled";
export type EventPaymentMethod = "havale" | "elden";

export type EventRow = {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  banner_url: string | null;
  branch: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  fee_try: number;
  capacity: number | null;
  registration_deadline: string | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
};

export type EventInput = {
  type: EventType;
  title: string;
  description: string | null;
  branch: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  fee_try: number;
  capacity: number | null;
  registration_deadline: string | null;
};

export type EventRegistrationRow = {
  id: string;
  event_id: string;
  athlete_id: string;
  registered_by: string;
  amount_due: number;
  payment_method: EventPaymentMethod | null;
  receipt_url: string | null;
  note: string | null;
  status: EventRegistrationStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  athletes?: { full_name: string; parent_user_id: string | null; parent_phone: string | null } | null;
  events?: { title: string; start_date: string; banner_url: string | null } | null;
};

const EVENT_FIELDS =
  "id, type, title, description, banner_url, branch, location, start_date, end_date, fee_try, capacity, registration_deadline, status, created_by, created_at";
const REGISTRATION_FIELDS =
  "id, event_id, athlete_id, registered_by, amount_due, payment_method, receipt_url, note, status, created_at, reviewed_at, reviewed_by";

// Veli/sporcu/antrenör — herkesin gördüğü, sadece yayınlanmış etkinlikler.
export async function listPublishedEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("status", "published")
    .order("start_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Admin/koordinatör — kendi kapsamındaki tüm durumlar (RLS zaten kısıtlıyor).
export async function listManageableEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from("events").select(EVENT_FIELDS).order("start_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getEvent(id: string): Promise<EventRow> {
  const { data, error } = await supabase.from("events").select(EVENT_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createEvent(input: EventInput): Promise<EventRow> {
  const { data: userRow, error: userError } = await supabase.auth.getUser();
  if (userError || !userRow.user) throw new Error("Oturum bulunamadı.");
  const { data: me, error: meError } = await supabase.from("users").select("id, club_id").eq("auth_user_id", userRow.user.id).single();
  if (meError) throw meError;

  const { data, error } = await supabase
    .from("events")
    .insert({ ...input, club_id: me.club_id, created_by: me.id, status: "draft" })
    .select(EVENT_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const { error } = await supabase.from("events").update(input).eq("id", id);
  if (error) throw error;
}

export async function publishEvent(event: EventRow): Promise<void> {
  const { error } = await supabase.from("events").update({ status: "published" }).eq("id", event.id);
  if (error) throw error;
  await notifyEventPublished(event).catch(() => {});
}

export async function cancelEvent(event: Pick<EventRow, "id" | "title">): Promise<void> {
  const { error } = await supabase.from("events").update({ status: "cancelled" }).eq("id", event.id);
  if (error) throw error;
  await notifyEventCancelled(event).catch(() => {});
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// Banner tekil bir görsel — Mağaza'daki addProductPhoto ile aynı yükleme
// deseni (Base64 -> ArrayBuffer -> upload), ama bucket PUBLIC olduğu için
// imzalı URL yerine düz getPublicUrl() kullanılıyor.
export async function addEventBanner(eventId: string, localUri: string): Promise<string> {
  const fileExt = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${eventId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage.from("event-banners").upload(path, arrayBuffer, { contentType });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("event-banners").getPublicUrl(path);
  const { error: updateError } = await supabase.from("events").update({ banner_url: data.publicUrl }).eq("id", eventId);
  if (updateError) throw updateError;

  return data.publicUrl;
}

export async function removeEventBanner(eventId: string): Promise<void> {
  const { error } = await supabase.from("events").update({ banner_url: null }).eq("id", eventId);
  if (error) throw error;
}

// Veli — kendi kayıtları, tüm sporcuları/etkinlikleri kapsar.
export async function listMyRegistrations(): Promise<EventRegistrationRow[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(`${REGISTRATION_FIELDS}, events(title, start_date, banner_url)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as EventRegistrationRow[]) ?? [];
}

// Admin/koordinatör — bir etkinliğin kayıt listesi.
export async function listEventRegistrations(eventId: string): Promise<EventRegistrationRow[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(`${REGISTRATION_FIELDS}, athletes(full_name, parent_user_id, parent_phone)`)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as EventRegistrationRow[]) ?? [];
}

// "Yönet" listesindeki HER etkinlik kartının üzerinde kendi bekleyen kayıt
// sayısını gösterebilmek için — tek bir toplam yerine event_id'ye göre
// gruplanmış sayım. Sadece id/event_id çekip client'ta sayıyoruz (bekleyen
// kayıt sayısı normalde küçük olduğu için ayrı bir RPC/agregasyona gerek yok).
export async function getPendingRegistrationCountsByEvent(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("event_registrations").select("event_id").eq("status", "pending");
  if (error) return {};
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => { counts[r.event_id] = (counts[r.event_id] ?? 0) + 1; });
  return counts;
}

export async function registerForEvent(
  event: Pick<EventRow, "id" | "title" | "fee_try">,
  athleteId: string,
  athleteName: string,
  paymentMethod: EventPaymentMethod | null,
  note: string | null
): Promise<EventRegistrationRow> {
  const { data, error } = await supabase.rpc("create_event_registration", {
    p_event_id: event.id,
    p_athlete_id: athleteId,
    p_payment_method: paymentMethod,
    p_note: note,
  });
  if (error) throw error;
  const registration = data as EventRegistrationRow;
  if (event.fee_try === 0) {
    await notifyRegistrationReviewed(registration, event.title, "approved").catch(() => {});
  } else {
    await notifyRegistrationSubmitted(registration, event.title, athleteName).catch(() => {});
  }
  return registration;
}

// "Ödedim" beyanında isteğe bağlı dekont fotoğrafı — uploadPaymentReceipt
// ile birebir aynı desen (private bucket, ~10 yıllık imzalı URL).
export async function addRegistrationReceipt(registrationId: string, localUri: string): Promise<void> {
  const fileExt = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${registrationId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage.from("event-receipts").upload(path, arrayBuffer, { contentType });
  if (uploadError) throw uploadError;

  const { data: signedData, error: signError } = await supabase.storage.from("event-receipts").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const { error: updateError } = await supabase
    .from("event_registrations")
    .update({ receipt_url: signedData.signedUrl })
    .eq("id", registrationId);
  if (updateError) throw updateError;
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: "approved" | "rejected",
  eventTitle: string
): Promise<void> {
  const { data, error } = await supabase.rpc("update_event_registration_status", {
    p_registration_id: registrationId,
    p_status: status,
  });
  if (error) throw error;
  await notifyRegistrationReviewed(data as EventRegistrationRow, eventTitle, status).catch(() => {});
}

export async function cancelMyRegistration(registrationId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_my_event_registration", { p_registration_id: registrationId });
  if (error) throw error;
}

// Bir etkinlik yayınlandığında ilgili ailelere bildirim — branch varsa o
// branşın aktif sporcularının veli/kendi hesabı + branş antrenörleri +
// koordinatör, branch null ise tüm kulüp. notifyMatchCreated'daki
// toplama/dedupe deseninin aynısı.
async function notifyEventPublished(event: EventRow): Promise<void> {
  const recipients = new Set<string>();

  let athleteQuery = supabase.from("athletes").select("parent_user_id, athlete_user_id, group_id").eq("status", "active");
  if (event.branch) {
    const { data: branchGroups } = await supabase.from("groups").select("id").eq("branch", event.branch);
    const groupIds = (branchGroups ?? []).map((g) => g.id);
    if (groupIds.length === 0) return;
    athleteQuery = athleteQuery.in("group_id", groupIds);
  }
  const { data: athletes } = await athleteQuery;
  (athletes ?? []).forEach((a) => {
    if (a.parent_user_id) recipients.add(a.parent_user_id);
    if (a.athlete_user_id) recipients.add(a.athlete_user_id);
  });

  if (event.branch) {
    const { data: branchRow } = await supabase.from("branches").select("coordinator_user_id").eq("name", event.branch).maybeSingle();
    if (branchRow?.coordinator_user_id) recipients.add(branchRow.coordinator_user_id);
  }
  if (recipients.size === 0) return;

  const typeLabel = EVENT_TYPE_LABEL[event.type];
  const title = `Yeni ${typeLabel}`;
  const dateLabel = new Date(event.start_date).toLocaleDateString("tr-TR");
  const body = `${event.title} — ${dateLabel}${event.fee_try > 0 ? ` — ${event.fee_try.toLocaleString("tr-TR")} ₺` : " — Ücretsiz"}`;

  await Promise.all(
    Array.from(recipients).map((id) =>
      sendNotification(id, title, body, "event_published", { eventId: event.id }).catch(() => {})
    )
  );
}

// Kayıt bildirildiğinde admin + ilgili branş koordinatörüne — notifyPaymentClaim deseni.
async function notifyRegistrationSubmitted(
  registration: EventRegistrationRow,
  eventTitle: string,
  athleteName: string
): Promise<void> {
  const { data: admins } = await supabase.from("users").select("id").eq("role", "club_admin").eq("is_active", true);
  const recipients = new Set<string>((admins ?? []).map((a) => a.id));

  const { data: event } = await supabase.from("events").select("branch").eq("id", registration.event_id).maybeSingle();
  if (event?.branch) {
    const { data: branchRow } = await supabase.from("branches").select("coordinator_user_id").eq("name", event.branch).maybeSingle();
    if (branchRow?.coordinator_user_id) recipients.add(branchRow.coordinator_user_id);
  }
  if (recipients.size === 0) return;

  const title = "Etkinlik Kayıt Bildirimi";
  const body = `${athleteName}, "${eventTitle}" için ${registration.amount_due.toLocaleString("tr-TR")} ₺ ödediğini bildirdi — kontrol edip onaylayabilirsiniz.`;

  await Promise.all(
    Array.from(recipients).map((id) =>
      sendNotification(id, title, body, "event_registration_submitted", { eventId: registration.event_id }).catch(() => {})
    )
  );
}

async function notifyRegistrationReviewed(
  registration: EventRegistrationRow,
  eventTitle: string,
  status: "approved" | "rejected"
): Promise<void> {
  const title = status === "approved" ? "Etkinlik Kaydı Onaylandı" : "Etkinlik Kaydı Reddedildi";
  const body =
    status === "approved"
      ? `"${eventTitle}" etkinliği için kaydın onaylandı.`
      : `"${eventTitle}" etkinliği için kaydın reddedildi.`;
  await sendNotification(
    registration.registered_by,
    title,
    body,
    status === "approved" ? "event_registration_approved" : "event_registration_rejected",
    { eventId: registration.event_id }
  ).catch(() => {});
}

// Etkinlik iptal edilince, henüz reddedilmemiş/iptal edilmemiş (yani hâlâ
// geçerli sayılan) kayıtların sahiplerine bildirim gider — ödeme yapmış
// olabilecekleri için kulüp yönetimiyle iletişime geçme notu eklenir.
async function notifyEventCancelled(event: Pick<EventRow, "id" | "title">): Promise<void> {
  const { data: regs } = await supabase
    .from("event_registrations")
    .select("registered_by, status, amount_due")
    .eq("event_id", event.id)
    .in("status", ["pending", "approved"]);
  if (!regs || regs.length === 0) return;

  const title = "Etkinlik İptal Edildi";
  await Promise.all(
    regs.map((r) => {
      const body =
        r.status === "approved" && r.amount_due > 0
          ? `"${event.title}" etkinliği iptal edildi. Ödeme yaptıysan kulüp yönetimiyle iletişime geçebilirsin.`
          : `"${event.title}" etkinliği iptal edildi.`;
      return sendNotification(r.registered_by, title, body, "event_cancelled", { eventId: event.id }).catch(() => {});
    })
  );
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  etkinlik: "Etkinlik",
  turnuva: "Turnuva",
  kamp: "Kamp",
};

export const REGISTRATION_STATUS_LABEL: Record<EventRegistrationStatus, string> = {
  pending: "Onay Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  cancelled: "İptal Edildi",
};
