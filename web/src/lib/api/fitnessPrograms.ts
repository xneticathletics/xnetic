import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

// Mobildeki src/lib/api/fitnessPrograms.ts ile aynı tablolar/kolonlar
// ("fitness_programs", "fitness_program_items").
export type FitnessProgramItem = {
  id: string;
  program_id: string;
  category: string;
  exercise_key: string;
  exercise_name: string;
  sets: number;
  reps: number;
  sort_order: number;
};

export type FitnessProgramItemInput = {
  category: string;
  exercise_key: string;
  exercise_name: string;
  sets: number;
  reps: number;
};

export type FitnessProgram = {
  id: string;
  name: string;
  group_id: string;
  created_at: string;
  groups?: { name: string; branch: string } | null;
};

const PROGRAM_FIELDS = "id, name, group_id, created_at";
const ITEM_FIELDS = "id, program_id, category, exercise_key, exercise_name, sets, reps, sort_order";

export async function listPrograms(): Promise<FitnessProgram[]> {
  const { data, error } = await supabase
    .from("fitness_programs")
    .select(`${PROGRAM_FIELDS}, groups(name, branch)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FitnessProgram[]) ?? [];
}

export async function getProgram(id: string): Promise<FitnessProgram> {
  const { data, error } = await supabase
    .from("fitness_programs")
    .select(`${PROGRAM_FIELDS}, groups(name, branch)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as FitnessProgram;
}

export async function listProgramItems(programId: string): Promise<FitnessProgramItem[]> {
  const { data, error } = await supabase
    .from("fitness_program_items")
    .select(ITEM_FIELDS)
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function deleteProgram(id: string) {
  const { error } = await supabase.from("fitness_programs").delete().eq("id", id);
  if (error) throw error;
}

// Bir grubun tüm bağlı hesaplarına (sporcuların veli/kendi hesabı) + grubun
// baş/yardımcı antrenör(ler)ine yeni program bildirimi gönderir. Bildirim
// metnine programdaki hareketlerin kısa bir özeti de eklenir. Mobildeki
// notifyProgramPublished ile birebir aynı mantık.
async function notifyProgramPublished(groupId: string, programName: string, items: FitnessProgramItemInput[]) {
  const recipients = new Set<string>();

  const [athletesResult, headResult] = await Promise.all([
    supabase.from("athletes").select("parent_user_id, athlete_user_id").eq("group_id", groupId),
    supabase.from("groups").select("head_coach_id").eq("id", groupId).maybeSingle(),
  ]);
  (athletesResult.data ?? []).forEach((a: any) => {
    if (a.parent_user_id) recipients.add(a.parent_user_id);
    if (a.athlete_user_id) recipients.add(a.athlete_user_id);
  });
  if (headResult.data?.head_coach_id) recipients.add(headResult.data.head_coach_id);

  const summary = items.map((i) => `${i.exercise_name} (${i.sets}x${i.reps})`).join(", ");
  const title = "Yeni Fitness Programı";
  const body = `"${programName}" programı yayınlandı: ${summary}`;

  await Promise.all(
    Array.from(recipients).map((uid) => sendNotification(uid, title, body, "fitness_program").catch(() => {}))
  );
}

// Programı ve tüm hareket kayıtlarını tek seferde oluşturur, ardından
// grubun tüm ilgililerine bildirim gönderir.
export async function publishFitnessProgram(input: {
  name: string;
  group_id: string;
  created_by: string | null;
  items: FitnessProgramItemInput[];
}) {
  const { data: program, error: programError } = await supabase
    .from("fitness_programs")
    .insert({ name: input.name, group_id: input.group_id, created_by: input.created_by })
    .select()
    .single();
  if (programError) throw programError;

  const rows = input.items.map((item, index) => ({
    program_id: program.id,
    category: item.category,
    exercise_key: item.exercise_key,
    exercise_name: item.exercise_name,
    sets: item.sets,
    reps: item.reps,
    sort_order: index,
  }));
  const { error: itemsError } = await supabase.from("fitness_program_items").insert(rows);
  if (itemsError) throw itemsError;

  await notifyProgramPublished(input.group_id, input.name, input.items);
  return program;
}
