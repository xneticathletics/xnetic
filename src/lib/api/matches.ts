import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type MatchRow = {
  id: string;
  group_id: string | null;
  opponent_name: string;
  match_date: string;
  start_time: string;
  location: string | null;
  notes: string | null;
  our_score: number | null;
  opponent_score: number | null;
  // Bireysel branşlarda (Yüzme, Atletizm vb.) skor yerine kullanılan
  // serbest metin sonuç açıklaması — bkz. branches.is_individual.
  result_note: string | null;
  groups?: { name: string; branch: string } | null;
};

export type MatchInput = {
  group_id: string | null;
  opponent_name: string;
  match_date: string;
  start_time: string;
  location: string | null;
  notes: string | null;
  our_score: number | null;
  opponent_score: number | null;
  result_note: string | null;
};

const MATCH_FIELDS =
  "id, group_id, opponent_name, match_date, start_time, location, notes, our_score, opponent_score, result_note";

export type MatchResult = "win" | "draw" | "loss" | null;

export function getMatchResult(m: Pick<MatchRow, "our_score" | "opponent_score">): MatchResult {
  if (m.our_score === null || m.opponent_score === null) return null;
  if (m.our_score > m.opponent_score) return "win";
  if (m.our_score < m.opponent_score) return "loss";
  return "draw";
}

export async function listMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(`${MATCH_FIELDS}, groups(name, branch)`)
    .order("match_date", { ascending: true });
  if (error) throw error;
  return (data as unknown as MatchRow[]) ?? [];
}

export async function listMatchesForGroups(groupIds: string[]): Promise<MatchRow[]> {
  if (groupIds.length === 0) return [];
  const { data, error } = await supabase
    .from("matches")
    .select(`${MATCH_FIELDS}, groups(name, branch)`)
    .in("group_id", groupIds)
    .order("match_date", { ascending: true });
  if (error) throw error;
  return (data as unknown as MatchRow[]) ?? [];
}

export async function getMatch(id: string): Promise<MatchRow> {
  const { data, error } = await supabase
    .from("matches")
    .select(`${MATCH_FIELDS}, groups(name, branch)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as MatchRow;
}

export async function createMatch(input: MatchInput) {
  const { data, error } = await supabase.from("matches").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateMatch(id: string, input: MatchInput) {
  const { data, error } = await supabase.from("matches").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw error;
}

export type MatchRosterEntry = {
  athlete_id: string;
  full_name: string;
  photo_url: string | null;
  selected: boolean;
};

// Maçın bağlı olduğu grubun MÜSABIK işaretli aktif sporcularını döner
// (Spor Okulu sporcuları maç kadrosuna girmez). Bu grubu birincil grubu
// olarak taşıyanlar YANINDA, bu grubu EK grup olarak işaretlenmiş
// sporcular da (Sporcu Yönetimi'ndeki "Ek Gruplar" — ör. birincil grubu
// U15 ama U14'te de oynayan bir müsabık) listeye dahil edilir.
export async function getMatchRoster(matchId: string, groupId: string): Promise<MatchRosterEntry[]> {
  const [primaryResult, extraLinksResult, rosterResult] = await Promise.all([
    supabase
      .from("athletes")
      .select("id, full_name, photo_url")
      .eq("group_id", groupId)
      .eq("status", "active")
      .eq("athlete_type", "musabik"),
    supabase.from("athlete_groups").select("athlete_id").eq("group_id", groupId),
    supabase.from("match_roster").select("athlete_id").eq("match_id", matchId),
  ]);
  if (primaryResult.error) throw primaryResult.error;
  if (extraLinksResult.error) throw extraLinksResult.error;
  if (rosterResult.error) throw rosterResult.error;

  const byId = new Map<string, { id: string; full_name: string; photo_url: string | null }>();
  (primaryResult.data ?? []).forEach((a) => byId.set(a.id, a));

  const extraAthleteIds = (extraLinksResult.data ?? []).map((r) => r.athlete_id);
  if (extraAthleteIds.length > 0) {
    const { data: extraAthletes, error: extraAthletesError } = await supabase
      .from("athletes")
      .select("id, full_name, photo_url")
      .in("id", extraAthleteIds)
      .eq("status", "active")
      .eq("athlete_type", "musabik");
    if (extraAthletesError) throw extraAthletesError;
    (extraAthletes ?? []).forEach((a) => byId.set(a.id, a));
  }

  const selectedIds = new Set((rosterResult.data ?? []).map((r) => r.athlete_id));
  return Array.from(byId.values())
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"))
    .map((a) => ({
      athlete_id: a.id,
      full_name: a.full_name,
      photo_url: a.photo_url,
      selected: selectedIds.has(a.id),
    }));
}

export type RosterConflict = { opponentName: string; matchDate: string };

// Bir sporcu, aynı gün BAŞKA bir maçın kadrosunda zaten var mı? (Ör.
// hem U14 hem U15'te oynayan bir sporcu, aynı gün iki farklı maça
// seçilmiş olabilir.) Kadroya eklerken basit bir uyarı göstermek için.
export async function checkRosterConflict(
  athleteId: string,
  matchDate: string,
  excludeMatchId: string
): Promise<RosterConflict | null> {
  const { data, error } = await supabase
    .from("match_roster")
    .select("matches!inner(id, match_date, opponent_name)")
    .eq("athlete_id", athleteId)
    .eq("matches.match_date", matchDate)
    .neq("matches.id", excludeMatchId)
    .limit(1);
  if (error) throw error;
  const row = (data as any[] | null)?.[0];
  const match = row?.matches;
  if (!match) return null;
  return { opponentName: match.opponent_name, matchDate: match.match_date };
}

// Maçın kadrosunu tamamen yeni seçilen liste ile değiştirir.
export async function setMatchRoster(matchId: string, athleteIds: string[]) {
  const { error: delError } = await supabase.from("match_roster").delete().eq("match_id", matchId);
  if (delError) throw delError;
  if (athleteIds.length === 0) return;

  const { error: insError } = await supabase
    .from("match_roster")
    .insert(athleteIds.map((athlete_id) => ({ match_id: matchId, athlete_id })));
  if (insError) throw insError;
}

// Galibiyet geldiğinde her seferinde AYNI mesajı göndermemek için —
// rastgele seçilen, coşkulu 18 farklı tebrik cümlesi. Kaybedişte fazla
// uzatmadan sadece sonucu bildiriyoruz, o yüzden orada şablon sayısı az.
const WIN_TEMPLATES: ((g: string, o: string, us: number, os: number) => string)[] = [
  (g, o, us, os) => `🎉 Muhteşem bir galibiyet! ${g}, ${o} karşısında ${us}-${os} kazandı! Tebrikler şampiyonlar! 🏆`,
  (g, o, us, os) => `🔥 Harika oynadılar! ${g}, ${o}'yı ${us}-${os} mağlup etti. Bu takımla gurur duyuyoruz! 👏`,
  (g, o, us, os) => `🏆 Kazandık! ${g}, ${o} deplasmanında/evinde ${us}-${os} önde bitirdi. Emeği geçen herkese tebrikler! 💪`,
  (g, o, us, os) => `🎊 Ne maçtı ama! ${g} sahadan ${us}-${os} galip ayrıldı. Tebrikler çocuklar, gururlandırdınız! ⭐`,
  (g, o, us, os) => `👏 Süper bir performans! ${g}, ${o} karşısında ${us}-${os}'lik skorla kazandı. Böyle devam! 🙌`,
  (g, o, us, os) => `🥳 Galibiyet bizim! ${g}, ${o}'yı ${us}-${os} geçti. Emek veren tüm sporcularımıza ve antrenörlerimize teşekkürler! 🏅`,
  (g, o, us, os) => `🔥 ${g} sahayı ${us}-${os} önde terk etti! ${o} karşısında müthiş bir mücadeleydi. Tebrikler! 🎉`,
  (g, o, us, os) => `🏆 Bir zafer daha! ${g}, ${o}'ya karşı ${us}-${os} kazandı. Bu takım gerçekten çok çalışıyor! 💪`,
  (g, o, us, os) => `⭐ Gururlandırdınız! ${g}, ${o} maçından ${us}-${os} galibiyetle ayrıldı. Herkese kocaman tebrikler! 🎊`,
  (g, o, us, os) => `👏👏 Ter döktüler, kazandılar! ${g}, ${o}'yı ${us}-${os} yendi. Tebrikler şampiyonlar! 🏆`,
  (g, o, us, os) => `🎉 Skor: ${us}-${os}. ${g}, ${o} karşısında farklı bir galibiyete imza attı! Hepinizi tebrik ediyoruz! 🔥`,
  (g, o, us, os) => `💪 İnanç ve mücadele kazandı! ${g}, ${o}'yu ${us}-${os} geçerek üç puanın sahibi oldu. Tebrikler! 🏆`,
  (g, o, us, os) => `🥇 Yine kazandık! ${g}, ${o} karşısında ${us}-${os}'lik skorla sahadan galip ayrıldı. Çok gururluyuz! 🎊`,
  (g, o, us, os) => `🎉 Bugün bayram! ${g}, ${o}'ya karşı ${us}-${os} kazandı. Emeği geçen herkese sonsuz teşekkürler! 👏`,
  (g, o, us, os) => `🏆 ${g} kazandı! ${o} karşısında alınan ${us}-${os} galibiyet için tüm takıma tebrikler! 🔥`,
  (g, o, us, os) => `🙌 Harika bir takım oyunu! ${g}, ${o}'yu ${us}-${os} mağlup etti. Sizinle gurur duyuyoruz! ⭐`,
  (g, o, us, os) => `🎊 Galibiyet geldi! ${g}, ${o} karşısında ${us}-${os} önde bitirdi. Tebrikler, böyle devam edin! 💪`,
  (g, o, us, os) => `🏅 Bir galibiyet daha kazandık! ${g}, ${o}'yu ${us}-${os} yendi. Emeği geçen herkese teşekkürler! 🎉`,
];

const LOSS_TEMPLATES: ((g: string, o: string, us: number, os: number) => string)[] = [
  (g, o, us, os) => `${g}, bugün ${o} karşısında ${us}-${os} kaybetti. Bir sonraki maçta görüşmek üzere.`,
  (g, o, us, os) => `Maç sonucu: ${g} ${us}-${os} ${o}. Emeği geçen herkese teşekkürler, sıradaki maça bakıyoruz.`,
  (g, o, us, os) => `${g}, ${o} maçını ${us}-${os} kaybetti. Çalışmaya devam.`,
];

const DRAW_TEMPLATES: ((g: string, o: string, us: number, os: number) => string)[] = [
  (g, o, us, os) => `${g}, ${o} ile ${us}-${os} berabere kaldı.`,
  (g, o, us, os) => `Maç sonucu: ${g} ${us}-${os} ${o} — berabere.`,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Bir müsabakanın sonucu girildiğinde/değiştirildiğinde, o grubun
// velilerine, antrenörlerine (baş+yardımcı), branş koordinatörüne ve
// (varsa) kendi giriş hesabı olan sporculara bildirim gönderir. Galibiyette
// rastgele seçilen coşkulu bir tebrik, mağlubiyette/beraberlikte kısa ve
// net sadece sonuç bilgisi gönderilir.
export async function notifyMatchResult(match: MatchRow) {
  if (!match.group_id) return;

  const [groupResult, assistantCoachesResult, athletesResult] = await Promise.all([
    supabase.from("groups").select("name, branch, head_coach_id").eq("id", match.group_id).single(),
    supabase.from("group_coaches").select("coach_id").eq("group_id", match.group_id),
    supabase.from("athletes").select("parent_user_id, athlete_user_id").eq("group_id", match.group_id).eq("status", "active"),
  ]);
  if (groupResult.error || !groupResult.data) return;
  const group = groupResult.data;

  let coordinatorId: string | null = null;
  let isIndividual = false;
  if (group.branch) {
    const { data: branchRow } = await supabase
      .from("branches")
      .select("coordinator_user_id, is_individual")
      .eq("name", group.branch)
      .maybeSingle();
    coordinatorId = branchRow?.coordinator_user_id ?? null;
    isIndividual = branchRow?.is_individual ?? false;
  }

  // Bireysel branşlarda (Yüzme, Atletizm vb.) "galibiyet/mağlubiyet" skor
  // üzerinden hesaplanamaz — antrenörün serbest metinle girdiği sonuç
  // açıklaması olduğu gibi iletiliyor.
  let title: string;
  let body: string;
  if (isIndividual) {
    const note = match.result_note?.trim();
    if (!note) return;
    title = "Müsabaka Sonucu";
    body = `${group.name} — ${note}`;
  } else {
    const result = getMatchResult(match);
    if (!result || match.our_score === null || match.opponent_score === null) return;
    const templates = result === "win" ? WIN_TEMPLATES : result === "loss" ? LOSS_TEMPLATES : DRAW_TEMPLATES;
    body = pickRandom(templates)(group.name, match.opponent_name, match.our_score, match.opponent_score);
    title = result === "win" ? "🏆 Maç Sonucu — Galibiyet!" : result === "loss" ? "Maç Sonucu" : "Maç Sonucu — Beraberlik";
  }

  const recipients = new Set<string>();
  if (group.head_coach_id) recipients.add(group.head_coach_id);
  (assistantCoachesResult.data ?? []).forEach((r) => recipients.add(r.coach_id));
  if (coordinatorId) recipients.add(coordinatorId);
  (athletesResult.data ?? []).forEach((a) => {
    if (a.parent_user_id) recipients.add(a.parent_user_id);
    if (a.athlete_user_id) recipients.add(a.athlete_user_id);
  });
  if (recipients.size === 0) return;

  await Promise.all(Array.from(recipients).map((id) => sendNotification(id, title, body).catch(() => {})));
}
