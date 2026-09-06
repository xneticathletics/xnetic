import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
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

// Web sadece club_admin ve super_admin girişine izin veriyor (bkz.
// AuthContext.tsx WEB_ALLOWED_ROLES) — bu yüzden mobildeki src/lib/api/messages.ts
// ile aynı sözleşmeyi koruyoruz ama sadece bu iki rolün dallarını taşıyoruz;
// coach/parent/athlete dalları web'de hiç çalışmayacağı için gereksiz.
export async function listMyContacts(role: UserRole): Promise<Contact[]> {
  const myUserId = await getCurrentAppUserId();
  if (!myUserId) return [];

  const contacts = new Map<string, Contact>();

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

  // super_admin: hiçbir kulübün veli/sporcu/antrenör verisine erişimi
  // olmaması gerektiği için (gizlilik/güvenlik) mesajlaşma KASITLI olarak
  // sadece kulüp adminleriyle sınırlı.
  const { data, error } = await supabase
    .from("users")
    .select("id, name, photo_url, role")
    .eq("role", "club_admin")
    .eq("is_active", true)
    .neq("id", myUserId);
  if (error) throw error;
  (data ?? []).forEach((u) => contacts.set(u.id, u as Contact));
  return Array.from(contacts.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

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
