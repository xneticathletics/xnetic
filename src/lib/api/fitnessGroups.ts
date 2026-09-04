import { supabase } from "../supabase";

// Normal antrenman/yoklama gruplarından (groups) tamamen bağımsız — bir
// branştaki tüm müsabık sporculardan serbestçe seçilmiş, sadece fitness
// programı ataması için kullanılan özel kümeler. Web'deki
// web/src/lib/api/fitnessGroups.ts ile aynı tablolar/kolonlar.
export type FitnessGroupSummary = { id: string; name: string; branch: string; member_count: number };
export type MusabikAthlete = { id: string; full_name: string };
export type FitnessGroupDetail = { id: string; name: string; branch: string; athleteIds: string[] };

export async function listFitnessGroups(): Promise<FitnessGroupSummary[]> {
  const [groupsResult, membersResult] = await Promise.all([
    supabase.from("fitness_groups").select("id, name, branch").order("name", { ascending: true }),
    supabase.from("fitness_group_members").select("fitness_group_id"),
  ]);
  if (groupsResult.error) throw groupsResult.error;
  if (membersResult.error) throw membersResult.error;

  const counts = new Map<string, number>();
  (membersResult.data ?? []).forEach((m) => counts.set(m.fitness_group_id, (counts.get(m.fitness_group_id) ?? 0) + 1));

  return (groupsResult.data ?? []).map((g) => ({ ...g, member_count: counts.get(g.id) ?? 0 }));
}

export async function getFitnessGroup(id: string): Promise<FitnessGroupDetail> {
  const [groupResult, membersResult] = await Promise.all([
    supabase.from("fitness_groups").select("id, name, branch").eq("id", id).single(),
    supabase.from("fitness_group_members").select("athlete_id").eq("fitness_group_id", id),
  ]);
  if (groupResult.error) throw groupResult.error;
  if (membersResult.error) throw membersResult.error;
  return { ...groupResult.data, athleteIds: (membersResult.data ?? []).map((m) => m.athlete_id) };
}

// Fitness grubu oluşturma/düzenleme ekranındaki sporcu seçim listesi —
// SADECE seçilen branştaki, müsabık (spor okulu değil) ve aktif sporcular.
// groups!group_id: athletes→groups arasında birden fazla ilişki olduğu için
// (bkz. athletes.ts'teki aynı hint) PostgREST'e hangi FK'yı kullanacağını
// açıkça söylemek gerekiyor — branşa göre filtre ise embedded kolonda
// doğrudan .eq() desteklenmediği için client-side yapılıyor.
export async function listMusabikAthletesForBranch(branch: string): Promise<MusabikAthlete[]> {
  const { data, error } = await supabase
    .from("athletes")
    .select("id, full_name, groups!group_id(branch)")
    .eq("athlete_type", "musabik")
    .eq("status", "active");
  if (error) throw error;
  return ((data as any[]) ?? [])
    .filter((a) => a.groups?.branch === branch)
    .map((a) => ({ id: a.id, full_name: a.full_name }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
}

export async function createFitnessGroup(input: {
  name: string;
  branch: string;
  athleteIds: string[];
  created_by: string | null;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("fitness_groups")
    .insert({ name: input.name, branch: input.branch, created_by: input.created_by })
    .select("id")
    .single();
  if (error) throw error;

  if (input.athleteIds.length > 0) {
    const { error: memError } = await supabase
      .from("fitness_group_members")
      .insert(input.athleteIds.map((athlete_id) => ({ fitness_group_id: data.id, athlete_id })));
    if (memError) throw memError;
  }
  return data;
}

// Üye listesini TAMAMEN yeniden yazar (athlete_groups'taki setAthleteExtraGroups
// ile aynı sil-sonra-ekle deseni).
export async function updateFitnessGroup(id: string, input: { name: string; athleteIds: string[] }): Promise<void> {
  const { error } = await supabase.from("fitness_groups").update({ name: input.name }).eq("id", id);
  if (error) throw error;

  const { error: delError } = await supabase.from("fitness_group_members").delete().eq("fitness_group_id", id);
  if (delError) throw delError;

  if (input.athleteIds.length > 0) {
    const { error: insError } = await supabase
      .from("fitness_group_members")
      .insert(input.athleteIds.map((athlete_id) => ({ fitness_group_id: id, athlete_id })));
    if (insError) throw insError;
  }
}

export async function deleteFitnessGroup(id: string): Promise<void> {
  const { error } = await supabase.from("fitness_groups").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") throw new Error("Bu fitness grubuna atanmış programlar var — önce o programları silmelisin.");
    throw error;
  }
}
