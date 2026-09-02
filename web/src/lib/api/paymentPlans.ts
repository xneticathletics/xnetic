import { supabase } from "../supabase";

export type PaymentPlan = {
  id: string;
  athlete_id: string;
  amount: number;
  day_of_month: number;
  active: boolean;
};

export type PaymentPlanInput = {
  athlete_id: string;
  amount: number;
  day_of_month: number;
};

const MONTHS_AHEAD = 3;

function computeDueDate(year: number, monthIndex0: number, day: number): string {
  const lastDayOfMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  const d = new Date(year, monthIndex0, clampedDay);
  return d.toISOString().slice(0, 10);
}

export async function topUpPlan(plan: PaymentPlan) {
  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("due_date")
    .eq("plan_id", plan.id);
  if (existingError) throw existingError;

  const existingDates = new Set((existing ?? []).map((e) => e.due_date));
  const now = new Date();
  const rows: { plan_id: string; athlete_id: string; period: "monthly"; amount: number; due_date: string }[] = [];

  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const targetIndex = now.getMonth() + i;
    const targetYear = now.getFullYear() + Math.floor(targetIndex / 12);
    const normalizedMonth = ((targetIndex % 12) + 12) % 12;
    const dueDate = computeDueDate(targetYear, normalizedMonth, plan.day_of_month);

    if (!existingDates.has(dueDate)) {
      rows.push({ plan_id: plan.id, athlete_id: plan.athlete_id, period: "monthly", amount: plan.amount, due_date: dueDate });
    }
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("payments").insert(rows);
    if (insertError) throw insertError;
  }
}

export async function createPaymentPlan(input: PaymentPlanInput) {
  const { data, error } = await supabase.from("payment_plans").insert(input).select().single();
  if (error) throw error;
  await topUpPlan(data as PaymentPlan);
  return data;
}

export async function topUpAllActivePlans() {
  const { data: plans, error } = await supabase
    .from("payment_plans")
    .select("id, athlete_id, amount, day_of_month, active")
    .eq("active", true);
  if (error) throw error;

  for (const plan of plans ?? []) {
    await topUpPlan(plan as PaymentPlan);
  }
}
