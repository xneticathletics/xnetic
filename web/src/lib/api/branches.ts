import { supabase } from "../supabase";

export type Branch = {
  id: string;
  name: string;
  coordinator_user_id: string | null;
  coordinator?: { name: string } | null;
};

export async function listBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, coordinator_user_id, coordinator:coordinator_user_id(name)")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as unknown as Branch[]) ?? [];
}

export async function createBranch(name: string) {
  const { data, error } = await supabase.from("branches").insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function updateBranch(id: string, name: string) {
  const { data, error } = await supabase.from("branches").update({ name }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) throw error;
}

// Bir branşın koordinatörünü atar (ya da userId=null ile kaldırır).
export async function setBranchCoordinator(branchId: string, userId: string | null) {
  const { error } = await supabase.from("branches").update({ coordinator_user_id: userId }).eq("id", branchId);
  if (error) throw error;
}
