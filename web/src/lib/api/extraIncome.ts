import { supabase } from "../supabase";

export type ExtraIncome = {
  id: string;
  description: string;
  amount: number;
  income_date: string;
  created_at: string;
};

export type ExtraIncomeInput = {
  description: string;
  amount: number;
  income_date: string;
};

// Aidat dışı gelirler — forma/tişört satışı, branşa özgü malzeme satışı vb.
export async function listExtraIncome(): Promise<ExtraIncome[]> {
  const { data, error } = await supabase
    .from("extra_income")
    .select("id, description, amount, income_date, created_at")
    .order("income_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExtraIncome(input: ExtraIncomeInput) {
  const { data, error } = await supabase.from("extra_income").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExtraIncome(id: string) {
  const { error } = await supabase.from("extra_income").delete().eq("id", id);
  if (error) throw error;
}
