import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";

// Süper Admin'in KENDİ işletmesinin (X-NETIC'i bir SaaS olarak işletmenin)
// gelir/gider muhasebesi — herhangi bir kulübün finansıyla ilgisi yok.
// web/src/lib/api/platformFinance.ts ile birebir aynı (kasıtlı kopya).
export type PlatformTransactionType = "income" | "expense";

export type PlatformTransaction = {
  id: string;
  type: PlatformTransactionType;
  amount_try: number;
  description: string;
  category: string | null;
  transaction_date: string;
  created_at: string;
};

export type PlatformTransactionInput = {
  type: PlatformTransactionType;
  amount_try: number;
  description: string;
  category: string | null;
  transaction_date: string;
};

const FIELDS = "id, type, amount_try, description, category, transaction_date, created_at";

export async function listPlatformTransactions(): Promise<PlatformTransaction[]> {
  const { data, error } = await supabase
    .from("platform_transactions")
    .select(FIELDS)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPlatformTransaction(input: PlatformTransactionInput) {
  const myUserId = await getCurrentAppUserId();
  const { data, error } = await supabase
    .from("platform_transactions")
    .insert({ ...input, created_by: myUserId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlatformTransaction(id: string) {
  const { error } = await supabase.from("platform_transactions").delete().eq("id", id);
  if (error) throw error;
}

export type PlatformFinanceSummary = { totalIncome: number; totalExpense: number; net: number };

export function summarizePlatformTransactions(rows: PlatformTransaction[]): PlatformFinanceSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  rows.forEach((r) => {
    if (r.type === "income") totalIncome += Number(r.amount_try);
    else totalExpense += Number(r.amount_try);
  });
  return { totalIncome, totalExpense, net: totalIncome - totalExpense };
}
