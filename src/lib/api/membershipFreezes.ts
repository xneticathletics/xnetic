import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
import { sendNotification } from "./notifications";

export type FreezeRequestedBy = "parent" | "admin";

export type MembershipFreeze = {
  id: string;
  athlete_id: string;
  start_date: string;
  end_date: string;
  requested_by_role: FreezeRequestedBy;
  reason: string | null;
  created_at: string;
};

export type MembershipFreezeInput = {
  athlete_id: string;
  start_date: string;
  end_date: string;
  requested_by_role: FreezeRequestedBy;
  reason: string | null;
};

const FIELDS = "id, athlete_id, start_date, end_date, requested_by_role, reason, created_at";

export async function listFreezesForAthlete(athleteId: string): Promise<MembershipFreeze[]> {
  const { data, error } = await supabase
    .from("membership_freezes")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Bugün, herhangi bir dondurma aralığının içindeyse o kaydı döner — sporcu
// şu an "dondurulmuş" mu diye hızlıca kontrol etmek için.
export async function getActiveFreezeForAthlete(athleteId: string): Promise<MembershipFreeze | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("membership_freezes")
    .select(FIELDS)
    .eq("athlete_id", athleteId)
    .lte("start_date", today)
    .gte("end_date", today)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Bir dondurma oluşturulduğunda club_admin'lere, sporcunun grubundaki baş +
// yardımcı antrenör(ler)ine ve sporcuya bağlı hesaplara (veli VE sporcunun
// kendi hesabı — ikisi de bağlıysa ikisine de) bildirim gider.
async function notifyFreezeCreated(athleteId: string, freeze: MembershipFreeze) {
  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select("full_name, group_id, parent_user_id, athlete_user_id")
    .eq("id", athleteId)
    .single();
  if (athleteError || !athlete) return;

  const recipients = new Set<string>();
  if (athlete.parent_user_id) recipients.add(athlete.parent_user_id);
  if (athlete.athlete_user_id) recipients.add(athlete.athlete_user_id);

  if (athlete.group_id) {
    const [headResult, assistantResult] = await Promise.all([
      supabase.from("groups").select("head_coach_id").eq("id", athlete.group_id).maybeSingle(),
      supabase.from("group_coaches").select("coach_id").eq("group_id", athlete.group_id),
    ]);
    if (headResult.data?.head_coach_id) recipients.add(headResult.data.head_coach_id);
    (assistantResult.data ?? []).forEach((r) => recipients.add(r.coach_id));
  }

  const { data: admins } = await supabase.from("users").select("id").eq("role", "club_admin").eq("is_active", true);
  (admins ?? []).forEach((a) => recipients.add(a.id));

  const title = "Kayıt Dondurma";
  const body = `${athlete.full_name} için ${formatDate(freeze.start_date)} - ${formatDate(freeze.end_date)} arası kayıt dondurma talebi oluşturuldu.`;

  await Promise.all(
    Array.from(recipients).map((uid) => sendNotification(uid, title, body, "membership_freeze").catch(() => {}))
  );
}

export async function createMembershipFreeze(input: MembershipFreezeInput) {
  const myUserId = await getCurrentAppUserId();
  const { data, error } = await supabase
    .from("membership_freezes")
    .insert({ ...input, created_by: myUserId })
    .select()
    .single();
  if (error) throw error;

  await notifyFreezeCreated(input.athlete_id, data as MembershipFreeze);
  return data;
}

export async function deleteMembershipFreeze(id: string) {
  const { error } = await supabase.from("membership_freezes").delete().eq("id", id);
  if (error) throw error;
}
