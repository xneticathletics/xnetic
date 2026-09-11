import { supabase } from "../supabase";

export type Expense = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
};

export type ExpenseInput = {
  description: string;
  amount: number;
  expense_date: string;
};

function monthsAgoISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

// monthsBack: geriye dönük kaç ay getirilsin — varsayılan 24 ay (mobildeki
// aynı fonksiyonla aynı desen).
export async function listExpenses(monthsBack: number | null = 24): Promise<Expense[]> {
  let query = supabase
    .from("expenses")
    .select("id, description, amount, expense_date, created_at")
    .order("expense_date", { ascending: false });
  if (monthsBack != null) query = query.gte("expense_date", monthsAgoISO(monthsBack));

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createExpense(input: ExpenseInput) {
  const { data, error } = await supabase.from("expenses").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
