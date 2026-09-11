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

function monthsAgoISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

// Aidat dışı gelirler — forma/tişört satışı, branşa özgü malzeme satışı vb.
// monthsBack: geriye dönük kaç ay getirilsin — varsayılan 24 ay, tüm
// geçmişi görmek isteyen ekran null geçer (bkz. payments.ts listClubPayments).
export async function listExtraIncome(monthsBack: number | null = 24): Promise<ExtraIncome[]> {
  let query = supabase
    .from("extra_income")
    .select("id, description, amount, income_date, created_at")
    .order("income_date", { ascending: false });
  if (monthsBack != null) query = query.gte("income_date", monthsAgoISO(monthsBack));

  const { data, error } = await query;
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
