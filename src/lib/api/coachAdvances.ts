import { supabase } from "../supabase";

export type CoachAdvance = {
  id: string;
  coach_id: string;
  amount: number;
  given_date: string;
  note: string | null;
  created_at: string;
  users?: { name: string } | null;
};

export type CoachAdvanceDeductionInput = {
  coach_payment_id: string;
  deducted_amount: number;
};

const ADVANCE_FIELDS = "id, coach_id, amount, given_date, note, created_at";

export async function listCoachAdvances(): Promise<CoachAdvance[]> {
  const { data, error } = await supabase
    .from("coach_advances")
    .select(`${ADVANCE_FIELDS}, users:coach_id(name)`)
    .order("given_date", { ascending: false });
  if (error) throw error;
  return (data as unknown as CoachAdvance[]) ?? [];
}

// Avansı oluşturur, seçilen ödeme(ler)e dağılımını kaydeder VE o
// ödemelerin tutarını doğrudan azaltıp not düşer — Antrenör Ödemeleri
// listesinde ekstra bir ekrana gitmeden görünsün diye.
export async function createCoachAdvance(
  input: { coach_id: string; amount: number; given_date: string; note: string | null },
  deductions: CoachAdvanceDeductionInput[]
) {
  const { data: advance, error: advanceError } = await supabase
    .from("coach_advances")
    .insert(input)
    .select()
    .single();
  if (advanceError) throw advanceError;

  for (const d of deductions) {
    if (d.deducted_amount <= 0) continue;

    const { data: payment, error: paymentError } = await supabase
      .from("coach_payments")
      .select("amount, notes")
      .eq("id", d.coach_payment_id)
      .single();
    if (paymentError) throw paymentError;

    const newAmount = Number(payment.amount) - d.deducted_amount;
    const noteLine = `Avans kesintisi: -${d.deducted_amount.toLocaleString("tr-TR")} ₺ (${input.given_date})`;
    const newNotes = payment.notes ? `${payment.notes}\n${noteLine}` : noteLine;

    const { error: updateError } = await supabase
      .from("coach_payments")
      .update({ amount: newAmount, notes: newNotes })
      .eq("id", d.coach_payment_id);
    if (updateError) throw updateError;

    const { error: deductionError } = await supabase.from("coach_advance_deductions").insert({
      advance_id: advance.id,
      coach_payment_id: d.coach_payment_id,
      deducted_amount: d.deducted_amount,
    });
    if (deductionError) throw deductionError;
  }

  return advance;
}
