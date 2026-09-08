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

export type BranchFee = { id: string; name: string; standard_fee_try: number | null };
export type StandardFeeUpdateResult = { plansUpdated: number; paymentsUpdated: number };

// Branş bazlı aidat ücretleri SADECE admin'e görünür — kullanıcı kararı:
// "adminden başkasının diğer branşların aidatlarını görmesine gerek yok".
// branches tablosunun geri kalan kolonları (isim, koordinatör vb.) kulübün
// her üyesine açık kalmalı (grup/antrenman formlarında branş seçimi için),
// bu yüzden RLS satır bazlı bir kısıtlama yerine SADECE bu alanı okuyan,
// admin kontrolü yapan dar bir RPC kullanıyoruz — bkz. migration
// 20260908060000_restrict_branch_fee_visibility.sql.
export async function listBranchesWithFees(): Promise<BranchFee[]> {
  const { data, error } = await supabase.rpc("list_branches_with_fees");
  if (error) throw error;
  return (data as BranchFee[]) ?? [];
}

// Admin bir branşın sabit aidat ücretini değiştirdiğinde: (1) branches'a
// kaydedilir, (2) o branştaki sporcuların TÜM aktif aidat planlarının
// tutarı güncellenir, (3) BULUNULAN AY HARİÇ, henüz ödenmemiş gelecek
// aylardaki mevcut payments satırları da yeni tutara çekilir. Diğer
// branşlara hiç dokunulmaz — bkz. migration 20260908050000.
export async function updateBranchStandardFee(branchId: string, newFee: number): Promise<StandardFeeUpdateResult> {
  const { data, error } = await supabase
    .rpc("update_branch_standard_fee", { p_branch_id: branchId, p_new_fee: newFee })
    .single();
  if (error) throw error;
  const row = data as { plans_updated: number; payments_updated: number };
  return { plansUpdated: row.plans_updated, paymentsUpdated: row.payments_updated };
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

export type BranchStats = { activeAthleteCount: number; coachCount: number; venueCount: number };

// Branş koordinatörünün Ana Sayfa'sındaki özet satır için — admin'in kulüp
// geneli istatistik satırıyla aynı fikir, sadece bu branşa sınırlı.
export async function getBranchStats(branch: string): Promise<BranchStats> {
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, venue_id, head_coach_id")
    .eq("branch", branch);
  if (groupsError) throw groupsError;

  const groupIds = (groups ?? []).map((g) => g.id);
  const venueIds = new Set((groups ?? []).map((g) => g.venue_id).filter((v): v is string => !!v));
  const coachIds = new Set((groups ?? []).map((g) => g.head_coach_id).filter((c): c is string => !!c));

  if (groupIds.length === 0) return { activeAthleteCount: 0, coachCount: 0, venueCount: 0 };

  const [assistantsResult, athleteCountResult] = await Promise.all([
    supabase.from("group_coaches").select("coach_id").in("group_id", groupIds),
    supabase.from("athletes").select("id", { count: "exact", head: true }).in("group_id", groupIds).eq("status", "active"),
  ]);
  (assistantsResult.data ?? []).forEach((r) => coachIds.add(r.coach_id));

  return {
    activeAthleteCount: athleteCountResult.count ?? 0,
    coachCount: coachIds.size,
    venueCount: venueIds.size,
  };
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
