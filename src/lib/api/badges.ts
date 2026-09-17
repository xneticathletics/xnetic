import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";
import { getMyAthletes } from "./myAthletes";
import { colors } from "../../theme/tokens";

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
// title KISA VE YARATICI bir lakap (kullanıcı isteği) — sayıyı/detayı
// description'da veriyoruz, başlıkta tekrar etmiyoruz.
export const BADGE_CATALOG: Record<BadgeType, { title: (tier: number) => string; icon: string; description: (tier: number) => string }> = {
  antrenman_serisi: {
    title: (t) => (t >= 20 ? "Demir Disiplin" : t >= 10 ? "Kararlı" : "Azimli"),
    icon: "🔥",
    description: (t) => `Kesintisiz ${t} antrenmana katıldın.`,
  },
  grup_fitness: {
    title: (t) => (t >= 20 ? "Fitness Canavarı" : t >= 10 ? "Güçlü" : "Formda"),
    icon: "💪",
    description: (t) => `${t} grup fitness antrenmanı tamamladın.`,
  },
  bireysel_fitness: {
    title: (t) => (t >= 20 ? "Bağımsız Savaşçı" : t >= 10 ? "Öz Disiplin" : "Kendi Yolunda"),
    icon: "🏋️",
    description: (t) => `${t} gün bireysel fitness çalışması yaptın.`,
  },
  kulup_kidem: {
    title: (t) => (t >= 5 ? "Kıdemli" : t >= 3 ? "Kulübün Bir Parçası" : "Yeni Nesil"),
    icon: "🎖️",
    description: (t) => `Kulüpte ${t}. yılın!`,
  },
  sampiyon: {
    title: () => "Şampiyon",
    icon: "🏆",
    description: () => "Tebrikler Şampiyon! Emeğinin karşılığını aldın.",
  },
  sosyal_paylasim: {
    title: (t) => (t >= 50 ? "Sosyal Medya Fenomeni" : t >= 25 ? "Sosyal Yıldız" : "Paylaşımcı"),
    icon: "📸",
    description: (t) => `Sosyal Alan'da ${t} paylaşım yaptın.`,
  },
  magaza_alisverisi: {
    title: (t) => (t >= 20 ? "VIP Alıcı" : t >= 10 ? "Sadık Müşteri" : "Alışverişçi"),
    icon: "🛍️",
    description: (t) => `Mağazadan ${t} ürün aldın.`,
  },
  mesajlasma: {
    title: (t) => (t >= 30 ? "Herkesin Arkadaşı" : t >= 20 ? "İletişim Ustası" : "Sosyal Kelebek"),
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

// Rozet görsellerinde (raf, popup, liste) tekrarlanan renk/boyut/parlama
// kuralları — TEK yerden yönetiliyor ki 4 farklı bileşende (BadgeShelf,
// BadgeInfoModal, BadgeEarnedModal, BadgesScreen) birbirinden sapmasın.
// Kullanıcı isteği: seviye sadece renkle değil, BOYUTLA da fark edilsin —
// en üst seviye (gold) ayrıca hafif bir "glow" (renkli gölge) alır.
export const BADGE_TIER_COLOR: Record<"bronze" | "silver" | "gold", string> = {
  bronze: colors.coral,
  silver: colors.teal,
  gold: colors.yellow,
};

// base: o bileşenin normal (bronze) boyutu — silver/gold buna göre büyür.
export function badgeIconSize(tierLevel: "bronze" | "silver" | "gold", base: number): number {
  return tierLevel === "gold" ? Math.round(base * 1.35) : tierLevel === "silver" ? Math.round(base * 1.15) : base;
}

// Sadece gold seviyede uygulanan gölge/parlama — React Native'in yerleşik
// shadow* (iOS) / elevation (Android) stilleriyle, yeni bir kütüphane yok.
export function badgeGlowStyle(tierLevel: "bronze" | "silver" | "gold"): object {
  if (tierLevel !== "gold") return {};
  return {
    shadowColor: colors.yellow, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  };
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
