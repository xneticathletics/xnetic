import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
import { getMyCoachedGroupIds } from "./myGroups";
import { getMyAthletes } from "./myAthletes";
import type { UserRole } from "../../context/AuthContext";

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  sent_at: string;
  read_at: string | null;
};

export type Contact = {
  id: string;
  name: string;
  photo_url: string | null;
  role: UserRole;
};

export type Conversation = {
  contact: Contact;
  lastMessage: Message;
  unreadCount: number;
};

const MESSAGE_FIELDS = "id, sender_id, receiver_id, body, sent_at, read_at";

// Bir kullanıcının kiminle mesajlaşabileceğini rolüne göre belirler:
// - club_admin: kulüpteki herkesle + süper adminle.
// - süper admin: sadece club_admin'lerle (gizlilik/güvenlik gereği —
//   hiçbir kulübün veli/sporcu/antrenör verisine erişimi olmamalı).
// - antrenör: sadece kendi grubundaki sporcuların bağlı hesaplarıyla (veli/
//   sporcu) + club_admin(ler).
// - veli/sporcu: SADECE kendi sporcusunun grubundaki baş/yardımcı
//   antrenörlerle ve branşının koordinatörüyle — admine mesaj atamaz.
// Not: bu, mesajlaşma ekranındaki KİŞİ SEÇME listesini sınırlar; RLS'teki
// can_message_recipient() fonksiyonu aynı kuralları veritabanı seviyesinde
// de zorunlu kılar (bkz. messages_insert_own politikası).
export async function listMyContacts(role: UserRole): Promise<Contact[]> {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return [];

  const contacts = new Map<string, Contact>();

  const addAdmins = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, photo_url, role")
      .eq("role", "club_admin")
      .eq("is_active", true)
      .neq("id", myUserId);
    if (error) throw error;
    (data ?? []).forEach((u) => contacts.set(u.id, u as Contact));
  };

  if (role === "club_admin") {
    const [clubResult, superAdminResult] = await Promise.all([
      supabase.from("users").select("id, name, photo_url, role").eq("is_active", true).neq("id", myUserId),
      supabase.from("users").select("id, name, photo_url, role").eq("role", "super_admin").eq("is_active", true),
    ]);
    if (clubResult.error) throw clubResult.error;
    if (superAdminResult.error) throw superAdminResult.error;
    (clubResult.data ?? []).forEach((u) => contacts.set(u.id, u as Contact));
    (superAdminResult.data ?? []).forEach((u) => contacts.set(u.id, u as Contact));
    return Array.from(contacts.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  // Süper Admin'in hiçbir kulübün veli/sporcu/antrenör verisine erişimi
  // olmaması gerektiği için (gizlilik/güvenlik, bkz. Test Kulübü kararı)
  // mesajlaşma KASITLI olarak sadece kulüp adminleriyle sınırlı.
  if (role === "super_admin") {
    await addAdmins();
    return Array.from(contacts.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  if (role === "coach") {
    const groupIds = await getMyCoachedGroupIds();
    if (groupIds.length > 0) {
      const { data, error } = await supabase
        .from("athletes")
        .select(
          "parent_user_id, athlete_user_id, parent:parent_user_id(id, name, photo_url, role), athlete_account:athlete_user_id(id, name, photo_url, role)"
        )
        .in("group_id", groupIds);
      if (error) throw error;
      (data as any[] ?? []).forEach((r) => {
        if (r.parent) contacts.set(r.parent.id, r.parent);
        if (r.athlete_account) contacts.set(r.athlete_account.id, r.athlete_account);
      });
    }
    await addAdmins();
    return Array.from(contacts.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  // parent / athlete — admin ARTIK dahil değil, sadece grubun antrenörleri
  // ve branşın koordinatörü.
  const myAthletes = await getMyAthletes();
  const groupIds = Array.from(new Set(myAthletes.map((a) => a.group_id).filter((id): id is string => !!id)));
  if (groupIds.length > 0) {
    const [headResult, assistantResult, groupsResult] = await Promise.all([
      supabase.from("groups").select("head_coach_id, head:head_coach_id(id, name, photo_url, role)").in("id", groupIds),
      supabase.from("group_coaches").select("coach:coach_id(id, name, photo_url, role)").in("group_id", groupIds),
      supabase.from("groups").select("branch").in("id", groupIds),
    ]);
    if (headResult.error) throw headResult.error;
    if (assistantResult.error) throw assistantResult.error;
    if (groupsResult.error) throw groupsResult.error;
    (headResult.data as any[] ?? []).forEach((g) => { if (g.head) contacts.set(g.head.id, g.head); });
    (assistantResult.data as any[] ?? []).forEach((r) => { if (r.coach) contacts.set(r.coach.id, r.coach); });

    const branchNames = Array.from(new Set((groupsResult.data ?? []).map((g) => g.branch).filter(Boolean)));
    if (branchNames.length > 0) {
      const { data: coordData, error: coordError } = await supabase
        .from("branches")
        .select("coordinator:coordinator_user_id(id, name, photo_url, role)")
        .in("name", branchNames);
      if (coordError) throw coordError;
      (coordData as any[] ?? []).forEach((b) => { if (b.coordinator) contacts.set(b.coordinator.id, b.coordinator); });
    }
  }
  return Array.from(contacts.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

// Benimle ilgili (gönderdiğim ya da aldığım) tüm mesajları çekip karşı
// tarafa göre gruplayarak konuşma listesini oluşturur — her karşı taraf
// için en son mesaj ve okunmamış sayısı.
export async function listConversations(): Promise<Conversation[]> {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_FIELDS)
    .or(`sender_id.eq.${myUserId},receiver_id.eq.${myUserId}`)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  const all = (data as Message[]) ?? [];
  if (all.length === 0) return [];

  const otherIds = new Set<string>();
  const lastByContact = new Map<string, Message>();
  const unreadByContact = new Map<string, number>();

  all.forEach((m) => {
    const otherId = m.sender_id === myUserId ? m.receiver_id : m.sender_id;
    otherIds.add(otherId);
    if (!lastByContact.has(otherId)) lastByContact.set(otherId, m);
    if (m.receiver_id === myUserId && !m.read_at) {
      unreadByContact.set(otherId, (unreadByContact.get(otherId) ?? 0) + 1);
    }
  });

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, photo_url, role")
    .in("id", Array.from(otherIds));
  if (usersError) throw usersError;
  const userById = new Map((users ?? []).map((u) => [u.id, u as Contact]));

  return Array.from(lastByContact.entries())
    .map(([otherId, lastMessage]) => ({
      contact: userById.get(otherId) ?? { id: otherId, name: "Bilinmeyen Kullanıcı", photo_url: null, role: "parent" as UserRole },
      lastMessage,
      unreadCount: unreadByContact.get(otherId) ?? 0,
    }))
    .sort((a, b) => b.lastMessage.sent_at.localeCompare(a.lastMessage.sent_at));
}

// Belirli bir kişiyle olan tüm mesajlaşma geçmişini (eskiden yeniye) döner.
export async function listMessagesWithUser(otherUserId: string): Promise<Message[]> {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_FIELDS)
    .or(
      `and(sender_id.eq.${myUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myUserId})`
    )
    .order("sent_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Alt menüdeki "Mesajlar" sekmesinin rozetinde gösterilecek toplam
// okunmamış mesaj sayısı (tüm konuşmalar toplamı).
export async function getTotalUnreadMessageCount(): Promise<number> {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", myUserId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function sendMessage(receiverId: string, body: string) {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) throw new Error("Kullanıcı bulunamadı");

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: myUserId, receiver_id: receiverId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Belirli bir kişiden gelen, henüz okunmamış tüm mesajları okundu yapar —
// sohbet ekranı açıldığında çağrılır.
export async function markMessagesRead(otherUserId: string) {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return;

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", myUserId)
    .is("read_at", null);
  if (error) throw error;
}

export async function getMyUnreadMessageCount(): Promise<number> {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", myUserId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}
