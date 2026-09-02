import { supabase } from "../supabase";

export type Branch = {
  id: string;
  name: string;
  coordinator_user_id: string | null;
  coordinator?: { name: string } | null;
  // Bireysel branşlarda (ör. Yüzme, Atletizm) tek bir "bizim skor / rakip
  // skor" anlamlı değil — müsabaka sonucu skor yerine serbest metin
  // açıklamayla giriliyor (bkz. matches.result_note).
  is_individual: boolean;
};

export async function listBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, coordinator_user_id, is_individual, coordinator:coordinator_user_id(name)")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as unknown as Branch[]) ?? [];
}

export async function createBranch(name: string, isIndividual: boolean = false) {
  const { data, error } = await supabase.from("branches").insert({ name, is_individual: isIndividual }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBranch(id: string, name: string, isIndividual: boolean) {
  const { data, error } = await supabase
    .from("branches")
    .update({ name, is_individual: isIndividual })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Bir branşın koordinatörünü atar (ya da userId=null ile kaldırır).
export async function setBranchCoordinator(branchId: string, userId: string | null) {
  const { error } = await supabase.from("branches").update({ coordinator_user_id: userId }).eq("id", branchId);
  if (error) throw error;
}

// Giriş yapan kullanıcı bir branşın koordinatörüyse o branşın adını
// döner, değilse null — Ana Sayfa'da otomatik branş kilitlemesi için.
export async function getMyCoordinatorBranch(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("branches")
    .select("name")
    .eq("coordinator_user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}
