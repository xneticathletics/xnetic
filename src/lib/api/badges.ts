import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
import { getMyAthletes } from "./myAthletes";

export type BadgeType =
  | "antrenman_serisi"
  | "grup_fitness"
  | "bireysel_fitness"
  | "kulup_kidem"
  | "sampiyon"
  | "sosyal_paylasim"
  | "magaza_alisverisi"
  | "mesajlasma";

export type Badge = {
  id: string;
  club_id: string;
  athlete_id: string | null;
  user_id: string | null;
  badge_type: BadgeType;
  tier: number;
  earned_at: string;
  seen_at: string | null;
  awarded_by: string | null;
};

// Rozetlerin görünen adı/açıklaması/ikonu — sabit referans veri (bkz.
// src/lib/fitnessExercises.ts'teki aynı hardcoded katalog deseni). Hesaplama
// SUNUCUDA (check_my_badges) yapılıyor, burası SADECE görüntüleme metadata'sı.
export const BADGE_CATALOG: Record<BadgeType, { title: (tier: number) => string; icon: string; description: (tier: number) => string }> = {
  antrenman_serisi: {
    title: (t) => `${t} Antrenmanlık Seri`,
    icon: "🔥",
    description: (t) => `Kesintisiz ${t} antrenmana katıldın.`,
  },
  grup_fitness: {
    title: (t) => `${t} Grup Fitness`,
    icon: "💪",
    description: (t) => `${t} grup fitness antrenmanı tamamladın.`,
  },
  bireysel_fitness: {
    title: (t) => `${t} Bireysel Fitness`,
    icon: "🏋️",
    description: (t) => `${t} gün bireysel fitness çalışması yaptın.`,
  },
  kulup_kidem: {
    title: (t) => `${t}. Yıl`,
    icon: "🎖️",
    description: (t) => `Kulüpte ${t}. yılın!`,
  },
  sampiyon: {
    title: () => "Şampiyon",
    icon: "🏆",
    description: () => "Branş koordinatörün tarafından şampiyon seçildin!",
  },
  sosyal_paylasim: {
    title: (t) => `${t} Paylaşım`,
    icon: "📸",
    description: (t) => `Sosyal Alan'da ${t} paylaşım yaptın.`,
  },
  magaza_alisverisi: {
    title: (t) => `${t} Alışveriş`,
    icon: "🛍️",
    description: (t) => `Mağazadan ${t} ürün aldın.`,
  },
  mesajlasma: {
    title: (t) => `${t} Arkadaş`,
    icon: "💬",
    description: (t) => `${t} farklı kişiyle mesajlaştın.`,
  },
};

// Tier'e göre görsel yükseliş — en yüksek tier her kategoride "gösterişli"
// olsun isteniyordu (bkz. kullanıcı isteği). Şampiyon rozeti tier'siz
// (her zaman tek), o da en gösterişli (glow) grupta.
export function badgeVisualTier(badge: Pick<Badge, "badge_type" | "tier">): "bronze" | "silver" | "gold" {
  if (badge.badge_type === "sampiyon") return "gold";
  if (badge.badge_type === "kulup_kidem") return badge.tier >= 5 ? "gold" : badge.tier >= 3 ? "silver" : "bronze";
  if (badge.badge_type === "sosyal_paylasim") return badge.tier >= 50 ? "gold" : badge.tier >= 25 ? "silver" : "bronze";
  if (badge.badge_type === "mesajlasma") return badge.tier >= 30 ? "gold" : badge.tier >= 20 ? "silver" : "bronze";
  return badge.tier >= 20 ? "gold" : badge.tier >= 10 ? "silver" : "bronze";
}

// Bana bağlı sporcular VE kendim için tüm rozet kategorilerini sunucuda
// yeniden hesaplatır, henüz kutlanmamış (seen_at IS NULL) rozetleri döner —
// HomeScreen bunu her odaklanmada (hafif throttle'lı) çağırıp dönen
// sonucu doğrudan konfeti kartında gösterir.
export async function checkMyBadges(): Promise<Badge[]> {
  const { data, error } = await supabase.rpc("check_my_badges");
  if (error) throw error;
  return (data as Badge[]) ?? [];
}

export async function markBadgeSeen(badgeId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_badge_seen", { p_badge_id: badgeId });
  if (error) throw error;
}

// "Rozetlerim" ekranı için — kendi kullanıcı rozetlerim + bana bağlı
// sporcuların rozetleri, en yeni önce.
export async function listMyBadges(): Promise<Badge[]> {
  const userId = await getCurrentAppUserId();
  if (!userId) return [];
  const myAthletes = await getMyAthletes();
  const athleteIds = myAthletes.map((a) => a.id);

  const orParts = [`user_id.eq.${userId}`];
  if (athleteIds.length > 0) orParts.push(`athlete_id.in.(${athleteIds.join(",")})`);

  const { data, error } = await supabase.from("badges").select("*").or(orParts.join(",")).order("earned_at", { ascending: false });
  if (error) throw error;
  return (data as Badge[]) ?? [];
}

// Sadece branş koordinatörü, kendi branşındaki bir sporcuya çağırabilir
// (bkz. award_champion_badge RLS/kontrolü) — RPC hata fırlatırsa (yetkisiz
// çağrı) olduğu gibi yukarı iletiliyor.
export async function awardChampionBadge(athleteId: string): Promise<Badge> {
  const { data, error } = await supabase.rpc("award_champion_badge", { p_athlete_id: athleteId });
  if (error) throw error;
  return data as Badge;
}
