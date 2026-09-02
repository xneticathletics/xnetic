import { supabase } from "../supabase";
import { getClubSettings } from "./clubSettings";
import { getCurrentClubId } from "./currentUser";

export type Coach = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  education_level: string | null;
  photo_url: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

const COACH_FIELDS =
  "id, name, email, phone, birth_date, education_level, photo_url, address, emergency_contact_name, emergency_contact_phone";

export async function listCoaches(): Promise<Coach[]> {
  const { data, error } = await supabase
    .from("users")
    .select(COACH_FIELDS)
    .eq("role", "coach")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCoach(id: string): Promise<Coach> {
  const { data, error } = await supabase
    .from("users")
    .select(COACH_FIELDS)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export type CoachInput = {
  name: string;
  phone: string | null;
  birth_date: string | null;
  education_level: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

// Antrenör Detayı ekranındaki "Düzenle" formundan çağrılır — admin,
// bir antrenörün kendi hesabından girmesi gereken kişisel bilgilerini
// (ad, telefon, doğum tarihi, öğrenim durumu) onun adına düzenleyebilir.
export async function updateCoach(id: string, input: Partial<CoachInput>) {
  const { error } = await supabase.from("users").update(input).eq("id", id);
  if (error) throw error;
}

// Bir antrenörün Baş Antrenör OLDUĞU ve Yardımcı Antrenör OLARAK atandığı
// TÜM grupları (isim + branşıyla) döner — Antrenör Detayı ekranında özet
// olarak göstermek için (her grup, ait olduğu branş etiketinin altında
// listelenebilsin diye branch dahil).
export async function getCoachGroups(coachId: string): Promise<{ id: string; name: string; branch: string }[]> {
  const [headResult, assistantResult] = await Promise.all([
    supabase.from("groups").select("id, name, branch").eq("head_coach_id", coachId),
    supabase.from("group_coaches").select("groups(id, name, branch)").eq("coach_id", coachId),
  ]);
  if (headResult.error) throw headResult.error;
  if (assistantResult.error) throw assistantResult.error;

  const head = (headResult.data ?? []).map((g) => ({ id: g.id, name: g.name, branch: g.branch }));
  const assistant = (assistantResult.data as any[] ?? [])
    .filter((r) => r.groups)
    .map((r) => ({ id: r.groups.id, name: r.groups.name, branch: r.groups.branch }));
  return [...head, ...assistant];
}

// Bir antrenörün her branştaki bilgileri BİRBİRİNDEN BAĞIMSIZDIR — genel/tek
// bir "kademe" yoktur, her branş kendi kademesini, belge numarasını,
// deneyim yılını ve o branşta kulübe başlama tarihini taşır (ör. aynı
// antrenör voleybolda 3. Kademe + 5 yıl deneyimliyken basketbolda 1.
// Kademe + yeni başlamış olabilir).
export type CoachBranchInfo = {
  branch_id: string;
  branch_name: string;
  level: number;
  license_no: string | null;
  experience_years: number | null;
  hire_date: string | null;
};

const COACH_BRANCH_FIELDS = "branch_id, level, license_no, experience_years, hire_date";

// Bir antrenörün uzmanlaştığı TÜM branşları ve her branştaki bilgilerini
// döner — bir antrenör artık birden fazla branşta çalışabilir.
export async function getCoachBranches(coachId: string): Promise<CoachBranchInfo[]> {
  const { data, error } = await supabase
    .from("coach_branches")
    .select(`${COACH_BRANCH_FIELDS}, branches(name)`)
    .eq("coach_id", coachId);
  if (error) throw error;
  return (data as any[] ?? []).map((r) => ({
    branch_id: r.branch_id, level: r.level, branch_name: r.branches?.name ?? "?",
    license_no: r.license_no ?? null, experience_years: r.experience_years ?? null, hire_date: r.hire_date ?? null,
  }));
}

export type CoachBranchEntry = {
  branch_id: string;
  level: number;
  license_no?: string | null;
  experience_years?: number | null;
  hire_date?: string | null;
};

// Bir antrenörün branş listesini (kademe, belge no, deneyim yılı, kulübe
// başlama tarihi dahil) TAMAMEN yeniden yazar.
export async function setCoachBranches(coachId: string, entries: CoachBranchEntry[]) {
  const { error: delError } = await supabase.from("coach_branches").delete().eq("coach_id", coachId);
  if (delError) throw delError;
  if (entries.length === 0) return;
  const { error: insError } = await supabase.from("coach_branches").insert(
    entries.map((e) => ({
      coach_id: coachId, branch_id: e.branch_id, level: e.level,
      license_no: e.license_no ?? null, experience_years: e.experience_years ?? null, hire_date: e.hire_date ?? null,
    }))
  );
  if (insError) throw insError;
}

// Tüm antrenörlerin branş bilgisini TEK sorguda çeker — Antrenörler
// listesinde her satırda N+1 sorgu yapmamak için.
export async function getAllCoachBranches(): Promise<Record<string, CoachBranchInfo[]>> {
  const { data, error } = await supabase
    .from("coach_branches")
    .select(`coach_id, ${COACH_BRANCH_FIELDS}, branches(name)`);
  if (error) throw error;
  const map: Record<string, CoachBranchInfo[]> = {};
  (data as any[] ?? []).forEach((r) => {
    (map[r.coach_id] ??= []).push({
      branch_id: r.branch_id, level: r.level, branch_name: r.branches?.name ?? "?",
      license_no: r.license_no ?? null, experience_years: r.experience_years ?? null, hire_date: r.hire_date ?? null,
    });
  });
  return map;
}

// Bir gruba antrenör atarken, o grubun branşında UZMAN OLMAYAN antrenörler
// listede hiç görünmesin diye — "voleybol antrenmanına sadece voleybol
// antrenörleri" kuralı burada uygulanıyor.
export async function listCoachesForBranch(branchId: string): Promise<Coach[]> {
  const { data, error } = await supabase
    .from("coach_branches")
    .select("coach_id, users:coach_id(id, name, email, phone, birth_date, education_level, photo_url, is_active)")
    .eq("branch_id", branchId);
  if (error) throw error;
  return (data as any[] ?? [])
    .map((r) => r.users)
    .filter((u) => u && u.is_active);
}

// Antrenörü tam silmiyoruz (giriş yapabilen gerçek bir hesap — hard
// delete için Supabase Auth tarafında ayrı, yetkili bir işlem gerekir).
// Bunun yerine hesabı pasifleştiriyoruz: listCoaches() zaten is_active=true
// filtresiyle çalıştığı için pasifleşen antrenör listeden otomatik kalkar.
export async function deactivateCoach(userId: string) {
  const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId);
  if (error) throw error;
}

export type CoachWithGroups = Coach & { groupNames: string[]; groupIds: string[] };

// Antrenör listesinde her antrenörün altında hangi grup(lar)da görevli
// olduğunu göstermek için — baş antrenörlük (groups.head_coach_id) ve
// yardımcı antrenörlük (group_coaches) kayıtlarını birleştirir. Grup
// id'lerini de taşır — bu sayede Antrenörler ekranında salona göre
// filtreleme yapılabilir (groups.venue_id üzerinden).
export async function listCoachesWithGroups(): Promise<CoachWithGroups[]> {
  const coaches = await listCoaches();
  if (coaches.length === 0) return [];

  const [headResult, assistantResult] = await Promise.all([
    supabase.from("groups").select("id, name, head_coach_id").not("head_coach_id", "is", null),
    supabase.from("group_coaches").select("coach_id, groups(id, name)"),
  ]);
  if (headResult.error) throw headResult.error;
  if (assistantResult.error) throw assistantResult.error;

  const groupsByCoach: Record<string, { id: string; name: string }[]> = {};
  (headResult.data ?? []).forEach((g) => {
    if (!g.head_coach_id) return;
    (groupsByCoach[g.head_coach_id] ??= []).push({ id: g.id, name: g.name });
  });
  (assistantResult.data as any[] ?? []).forEach((row) => {
    if (!row.coach_id || !row.groups) return;
    (groupsByCoach[row.coach_id] ??= []).push({ id: row.groups.id, name: row.groups.name });
  });

  return coaches.map((c) => {
    const gs = groupsByCoach[c.id] ?? [];
    return { ...c, groupNames: gs.map((g) => g.name), groupIds: gs.map((g) => g.id) };
  });
}

export type GroupAssignment = "none" | "head" | "assistant";

export type GroupStaffing = { headName: string | null; assistantNames: string[] };

export type GroupStaffingDetailed = {
  headCoachId: string | null;
  headCoachName: string | null;
  assistants: { id: string; name: string }[];
};

// Grup-merkezli "Genel Bakış" ekranı için — her grubun Baş Antrenör id/adı
// ve Yardımcı antrenörlerinin id/adı listesi (id'ler, atama/kaldırma
// işlemleri için gerekli).
export async function getGroupStaffingDetailed(): Promise<Record<string, GroupStaffingDetailed>> {
  const [groupsResult, assistantsResult] = await Promise.all([
    supabase.from("groups").select("id, head_coach_id, head:head_coach_id(name)"),
    supabase.from("group_coaches").select("group_id, coach_id, coach:coach_id(name)"),
  ]);
  if (groupsResult.error) throw groupsResult.error;
  if (assistantsResult.error) throw assistantsResult.error;

  const map: Record<string, GroupStaffingDetailed> = {};
  (groupsResult.data as any[] ?? []).forEach((g) => {
    map[g.id] = { headCoachId: g.head_coach_id ?? null, headCoachName: g.head?.name ?? null, assistants: [] };
  });
  (assistantsResult.data as any[] ?? []).forEach((row) => {
    if (!map[row.group_id]) map[row.group_id] = { headCoachId: null, headCoachName: null, assistants: [] };
    if (row.coach?.name) map[row.group_id].assistants.push({ id: row.coach_id, name: row.coach.name });
  });
  return map;
}

// Her grubun mevcut kadrosunu (Baş Antrenör + Yardımcı antrenörlerin
// isimleri) döner — antrenör atama ekranında boşlukları görmek için.
export async function getGroupStaffingMap(): Promise<Record<string, GroupStaffing>> {
  const [groupsResult, assistantsResult] = await Promise.all([
    supabase.from("groups").select("id, head_coach_id, head:head_coach_id(name)"),
    supabase.from("group_coaches").select("group_id, coach:coach_id(name)"),
  ]);
  if (groupsResult.error) throw groupsResult.error;
  if (assistantsResult.error) throw assistantsResult.error;

  const map: Record<string, GroupStaffing> = {};
  (groupsResult.data as any[] ?? []).forEach((g) => {
    map[g.id] = { headName: g.head?.name ?? null, assistantNames: [] };
  });
  (assistantsResult.data as any[] ?? []).forEach((row) => {
    if (!map[row.group_id]) map[row.group_id] = { headName: null, assistantNames: [] };
    if (row.coach?.name) map[row.group_id].assistantNames.push(row.coach.name);
  });
  return map;
}

// Bir antrenörün her gruptaki atama durumunu (Baş Antrenör / Yardımcı /
// Yok) döner — groups.head_coach_id ve group_coaches tablolarını birlikte
// okur.
export async function getCoachAssignments(coachId: string): Promise<Record<string, GroupAssignment>> {
  const [headResult, assistantResult] = await Promise.all([
    supabase.from("groups").select("id").eq("head_coach_id", coachId),
    supabase.from("group_coaches").select("group_id").eq("coach_id", coachId),
  ]);
  if (headResult.error) throw headResult.error;
  if (assistantResult.error) throw assistantResult.error;

  const map: Record<string, GroupAssignment> = {};
  (headResult.data ?? []).forEach((g) => { map[g.id] = "head"; });
  (assistantResult.data ?? []).forEach((g) => { map[g.group_id] = "assistant"; });
  return map;
}

// Bir antrenörün bir gruptaki atamasını değiştirir. Önce o gruptaki eski
// atamasını (varsa) temizler, sonra istenen yeni durumu uygular — bu
// sayede "Baş Antrenör" ↔ "Yardımcı" ↔ "Yok" arasında güvenle geçilebilir.
export async function setCoachAssignment(coachId: string, groupId: string, assignment: GroupAssignment) {
  await supabase.from("group_coaches").delete().eq("coach_id", coachId).eq("group_id", groupId);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("head_coach_id")
    .eq("id", groupId)
    .single();
  if (groupError) throw groupError;

  if (group?.head_coach_id === coachId) {
    const { error } = await supabase.from("groups").update({ head_coach_id: null }).eq("id", groupId);
    if (error) throw error;
  }

  if (assignment === "head") {
    const { error } = await supabase.from("groups").update({ head_coach_id: coachId }).eq("id", groupId);
    if (error) throw error;
  } else if (assignment === "assistant") {
    // Grup başına en fazla kaç Yardımcı Antrenör olabileceği artık
    // Profil → Gelişmiş Ayarlar'dan değiştirilebilir (varsayılan 2).
    const clubId = await getCurrentClubId();
    if (!clubId) throw new Error("Kulüp bulunamadı");
    const { assistant_coach_limit } = await getClubSettings(clubId);
    const { data: existing, error: countError } = await supabase
      .from("group_coaches")
      .select("coach_id")
      .eq("group_id", groupId);
    if (countError) throw countError;
    const otherAssistants = (existing ?? []).filter((r) => r.coach_id !== coachId);
    if (otherAssistants.length >= assistant_coach_limit) {
      throw new Error(`Bu grupta zaten ${assistant_coach_limit} Yardımcı Antrenör var. Önce birini çıkarmalısın.`);
    }

    // upsert kullanıyoruz — aynı antrenör/grup çifti için (delete'in hemen
    // ardından, ör. hızlı çift dokunma veya eski bir kayıt yüzünden) zaten
    // bir satır varsa hata vermek yerine üzerine yazar.
    const { error } = await supabase
      .from("group_coaches")
      .upsert(
        { coach_id: coachId, group_id: groupId, permission_level: "assistant_coach" },
        { onConflict: "group_id,coach_id" }
      );
    if (error) throw error;
  }
}
