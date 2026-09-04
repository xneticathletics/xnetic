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
  group_id: string | null;
  fitness_group_id: string | null;
  created_at: string;
  groups?: { name: string; branch: string } | null;
  fitness_groups?: { name: string; branch: string } | null;
};

const PROGRAM_FIELDS = "id, name, group_id, fitness_group_id, created_at";
const ITEM_FIELDS = "id, program_id, category, exercise_key, exercise_name, sets, reps, sort_order";

export async function listPrograms(): Promise<FitnessProgram[]> {
  const { data, error } = await supabase
    .from("fitness_programs")
    .select(`${PROGRAM_FIELDS}, groups(name, branch), fitness_groups(name, branch)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FitnessProgram[]) ?? [];
}

export async function getProgram(id: string): Promise<FitnessProgram> {
  const { data, error } = await supabase
    .from("fitness_programs")
    .select(`${PROGRAM_FIELDS}, groups(name, branch), fitness_groups(name, branch)`)
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

export type FitnessProgramCompletion = {
  id: string;
  program_id: string;
  athlete_id: string;
  completed_at: string;
  note: string | null;
  difficulty: number | null;
  duration_minutes: number | null;
  created_at: string;
  athletes?: { full_name: string } | null;
};

// Antrenör/admin tarafında — programı grubundaki hangi sporcuların
// tamamladığını görmek için. Mobildeki src/lib/api/fitnessPrograms.ts ile
// aynı "fitness_program_completions" tablosu — sporcu/veli tarafında
// "Antrenmanı Tamamladım" ile kaydediliyor (sadece mobilde, web'de veli/
// sporcu girişi yok).
export async function listCompletionsForProgram(programId: string): Promise<FitnessProgramCompletion[]> {
  const { data, error } = await supabase
    .from("fitness_program_completions")
    .select("id, program_id, athlete_id, completed_at, note, difficulty, duration_minutes, created_at, athletes(full_name)")
    .eq("program_id", programId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FitnessProgramCompletion[]) ?? [];
}

async function resolveGroupRecipients(groupId: string): Promise<Set<string>> {
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
  return recipients;
}

// Fitness gruplarının tek bir "baş antrenörü" kavramı yok (branş genelinden
// serbestçe seçilmiş sporcular) — sadece üye sporcuların veli/kendi
// hesaplarına gidiyor.
async function resolveFitnessGroupRecipients(fitnessGroupId: string): Promise<Set<string>> {
  const recipients = new Set<string>();
  const { data } = await supabase
    .from("fitness_group_members")
    .select("athletes(parent_user_id, athlete_user_id)")
    .eq("fitness_group_id", fitnessGroupId);
  (data ?? []).forEach((m: any) => {
    if (m.athletes?.parent_user_id) recipients.add(m.athletes.parent_user_id);
    if (m.athletes?.athlete_user_id) recipients.add(m.athletes.athlete_user_id);
  });
  return recipients;
}

// Bir grubun (normal ya da fitness) tüm bağlı hesaplarına yeni program
// bildirimi gönderir. Bildirim metnine programdaki hareketlerin kısa bir
// özeti de eklenir. Mobildeki notifyProgramPublished ile birebir aynı mantık.
async function notifyProgramPublished(
  target: { group_id: string | null; fitness_group_id: string | null },
  programName: string,
  items: FitnessProgramItemInput[]
) {
  const recipients = target.group_id
    ? await resolveGroupRecipients(target.group_id)
    : await resolveFitnessGroupRecipients(target.fitness_group_id!);

  const summary = items.map((i) => `${i.exercise_name} (${i.sets}x${i.reps})`).join(", ");
  const title = "Yeni Fitness Programı";
  const body = `"${programName}" programı yayınlandı: ${summary}`;

  await Promise.all(
    Array.from(recipients).map((uid) => sendNotification(uid, title, body, "fitness_program").catch(() => {}))
  );
}

// Programı ve tüm hareket kayıtlarını tek seferde oluşturur, ardından
// hedef grubun (normal ya da fitness — tam olarak biri verilmeli) tüm
// ilgililerine bildirim gönderir.
export async function publishFitnessProgram(input: {
  name: string;
  group_id?: string | null;
  fitness_group_id?: string | null;
  created_by: string | null;
  items: FitnessProgramItemInput[];
}) {
  const { data: program, error: programError } = await supabase
    .from("fitness_programs")
    .insert({
      name: input.name,
      group_id: input.group_id ?? null,
      fitness_group_id: input.fitness_group_id ?? null,
      created_by: input.created_by,
    })
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

  await notifyProgramPublished(
    { group_id: input.group_id ?? null, fitness_group_id: input.fitness_group_id ?? null },
    input.name,
    input.items
  );
  return program;
}
