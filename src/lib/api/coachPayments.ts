import { supabase } from "../supabase";

export type CoachPaymentStatus = "pending" | "paid";

export type CoachPayment = {
  id: string;
  coach_id: string;
  plan_id: string | null;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: CoachPaymentStatus;
  notes: string | null;
  created_at: string;
  users?: { name: string } | null;
};

const COACH_PAYMENT_FIELDS = "id, coach_id, plan_id, amount, due_date, paid_at, status, notes, created_at";

export async function listCoachPayments(): Promise<CoachPayment[]> {
  const { data, error } = await supabase
    .from("coach_payments")
    .select(`${COACH_PAYMENT_FIELDS}, users:coach_id(name)`)
    .order("due_date", { ascending: false });
  if (error) throw error;
  return (data as unknown as CoachPayment[]) ?? [];
}

// Avans verirken hangi bekleyen maaş(lar)dan kesileceğini seçmek için —
// sadece o antrenörün henüz ödenmemiş kayıtları.
export async function listPendingCoachPaymentsFor(coachId: string): Promise<CoachPayment[]> {
  const { data, error } = await supabase
    .from("coach_payments")
    .select(COACH_PAYMENT_FIELDS)
    .eq("coach_id", coachId)
    .eq("status", "pending")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data as unknown as CoachPayment[]) ?? [];
}

export async function markCoachPaymentPaid(id: string) {
  const { error } = await supabase
    .from("coach_payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markCoachPaymentPending(id: string) {
  const { error } = await supabase
    .from("coach_payments")
    .update({ status: "pending", paid_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoachPayment(id: string) {
  const { error } = await supabase.from("coach_payments").delete().eq("id", id);
  if (error) throw error;
}
