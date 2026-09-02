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

const ADVANCE_FIELDS = "id, coach_id, amount, given_date, note, created_at";

export async function listCoachAdvances(): Promise<CoachAdvance[]> {
  const { data, error } = await supabase
    .from("coach_advances")
    .select(`${ADVANCE_FIELDS}, users:coach_id(name)`)
    .order("given_date", { ascending: false });
  if (error) throw error;
  return (data as unknown as CoachAdvance[]) ?? [];
}

// Avansı oluşturur ve tutarı doğrudan, verilen bekleyen ödemeden (varsa
// antrenörün sıradaki/en yakın vadeli ödemesi) düşer — bkz. CoachAdvanceModal.
export async function createCoachAdvance(
  input: { coach_id: string; amount: number; given_date: string; note: string | null },
  deduction: { coach_payment_id: string; deducted_amount: number } | null
) {
  const { data: advance, error: advanceError } = await supabase
    .from("coach_advances")
    .insert(input)
    .select()
    .single();
  if (advanceError) throw advanceError;

  if (deduction && deduction.deducted_amount > 0) {
    const { data: payment, error: paymentError } = await supabase
      .from("coach_payments")
      .select("amount, notes")
      .eq("id", deduction.coach_payment_id)
      .single();
    if (paymentError) throw paymentError;

    const newAmount = Number(payment.amount) - deduction.deducted_amount;
    const noteLine = `Avans kesintisi: -${deduction.deducted_amount.toLocaleString("tr-TR")} ₺ (${input.given_date})`;
    const newNotes = payment.notes ? `${payment.notes}\n${noteLine}` : noteLine;

    const { error: updateError } = await supabase
      .from("coach_payments")
      .update({ amount: newAmount, notes: newNotes })
      .eq("id", deduction.coach_payment_id);
    if (updateError) throw updateError;

    const { error: deductionError } = await supabase.from("coach_advance_deductions").insert({
      advance_id: advance.id,
      coach_payment_id: deduction.coach_payment_id,
      deducted_amount: deduction.deducted_amount,
    });
    if (deductionError) throw deductionError;
  }

  return advance;
}
