import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";

// Bir antrenörün baş antrenör olduğu (groups.head_coach_id) veya yardımcı
// antrenör olarak atandığı (group_coaches) tüm grup id'lerini döner.
// Branş Koordinatörü ise, kendi grubu olmasa bile branşındaki TÜM
// grupları da kapsar — antrenman planlama, yoklama, duyuru, mesajlaşma,
// wellness görünürlüğü gibi bu fonksiyonu kullanan HER yerde koordinatör
// kendi branşının tamamını yönetebilmeli.
export async function getMyCoachedGroupIds(): Promise<string[]> {
  const userId = await getCurrentAppUserId();
  if (!userId) return [];

  const [headCoachResult, assistantResult, coordinatorBranchResult] = await Promise.all([
    supabase.from("groups").select("id").eq("head_coach_id", userId),
    supabase.from("group_coaches").select("group_id").eq("coach_id", userId),
    supabase.from("branches").select("name").eq("coordinator_user_id", userId),
  ]);

  if (headCoachResult.error) throw headCoachResult.error;
  if (assistantResult.error) throw assistantResult.error;
  if (coordinatorBranchResult.error) throw coordinatorBranchResult.error;

  const ids = new Set<string>();
  (headCoachResult.data ?? []).forEach((g) => ids.add(g.id));
  (assistantResult.data ?? []).forEach((g) => ids.add(g.group_id));

  const coordinatorBranches = (coordinatorBranchResult.data ?? []).map((b) => b.name);
  if (coordinatorBranches.length > 0) {
    const { data: branchGroups, error: branchGroupsError } = await supabase
      .from("groups")
      .select("id")
      .in("branch", coordinatorBranches);
    if (branchGroupsError) throw branchGroupsError;
    (branchGroups ?? []).forEach((g) => ids.add(g.id));
  }

  return Array.from(ids);
}

// Salon yetkilisi (bkz. venue_coaches) etiketi verilmiş bir antrenörün,
// koçluğunu yapmadığı gruplar dahil, KENDİ BRANŞINDAKİ tüm grupları görüp
// o salon için antrenman planlayabilmesi için — getMyCoachedGroupIds'ten
// FARKLI olarak koordinatörlük ya da atanmışlık gerektirmez, sadece
// coach_branches'taki "hangi branştayım" bilgisine bakar.
export async function getMyBranchGroupIds(): Promise<string[]> {
  const userId = await getCurrentAppUserId();
  if (!userId) return [];

  const { data: coachBranches, error } = await supabase
    .from("coach_branches")
    .select("branches(name)")
    .eq("coach_id", userId);
  if (error) throw error;

  const branchNames = (coachBranches ?? [])
    .map((r: any) => r.branches?.name as string | undefined)
    .filter((n): n is string => !!n);
  if (branchNames.length === 0) return [];

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id")
    .in("branch", branchNames);
  if (groupsError) throw groupsError;
  return (groups ?? []).map((g) => g.id);
}
