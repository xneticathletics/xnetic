import { supabase } from "../supabase";

export type PaymentStatus = "pending" | "paid" | "overdue";
export type PaymentPeriod = "weekly" | "monthly" | "yearly";

export type Payment = {
  id: string;
  athlete_id: string;
  period: PaymentPeriod;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: PaymentStatus;
  athletes?: {
    full_name: string;
    parent_name: string | null;
    parent_phone: string | null;
    parent_user_id: string | null;
    groups?: { branch: string } | null;
  } | null;
};

const PAYMENT_FIELDS = "id, athlete_id, period, amount, due_date, paid_at, status";

export async function listClubPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(`${PAYMENT_FIELDS}, athletes(full_name, parent_name, parent_phone, parent_user_id, groups!group_id(branch))`)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data as unknown as Payment[]) ?? [];
}

export async function markPaymentPaid(id: string) {
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function isOverdue(payment: Payment, graceDays: number = 0): boolean {
  if (payment.status !== "pending") return false;
  const due = new Date(payment.due_date);
  due.setDate(due.getDate() + graceDays);
  return due < new Date(new Date().toISOString().slice(0, 10));
}

export type MonthlyFinanceSummary = {
  expected: number;
  collected: number;
  pending: number;
  overdue: number;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export async function getMonthlyFinanceSummary(graceDays: number = 0): Promise<MonthlyFinanceSummary> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${pad2(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad2(month + 1)}-${pad2(lastDay)}`;

  const [thisMonthResult, allPendingResult] = await Promise.all([
    supabase.from("payments").select("amount, status, due_date").gte("due_date", start).lte("due_date", end),
    supabase.from("payments").select("amount, status, due_date").eq("status", "pending"),
  ]);
  if (thisMonthResult.error) throw thisMonthResult.error;
  if (allPendingResult.error) throw allPendingResult.error;

  let expected = 0;
  let collected = 0;
  let pending = 0;
  (thisMonthResult.data ?? []).forEach((p) => {
    const amount = Number(p.amount);
    expected += amount;
    if (p.status === "paid") collected += amount;
    else if (!isOverdue(p as Payment, graceDays)) pending += amount;
  });

  let overdue = 0;
  (allPendingResult.data ?? []).forEach((p) => {
    if (isOverdue(p as Payment, graceDays)) overdue += Number(p.amount);
  });

  return { expected, collected, pending, overdue };
}
