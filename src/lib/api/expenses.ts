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

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, description, amount, expense_date, created_at")
    .order("expense_date", { ascending: false });
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
