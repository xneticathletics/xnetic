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

// Şampiyon hariç 7 otomatik kategorinin eşik (tier) üçlüsü — admin/branş
// koordinatörü bunları kulüp bazında değiştirebilir (bkz. badgeTierSettings.ts).
// Burdaki değerler DB'deki badge_tier_thresholds() fonksiyonundaki
// varsayılanlarla birebir aynı olmalı.
export type TierThresholds = [number, number, number];
export type AutoBadgeType = Exclude<BadgeType, "sampiyon">;

export const DEFAULT_BADGE_TIERS: Record<AutoBadgeType, TierThresholds> = {
  antrenman_serisi: [5, 10, 20],
  grup_fitness: [5, 10, 20],
  bireysel_fitness: [5, 10, 20],
  kulup_kidem: [1, 3, 5],
  sosyal_paylasim: [10, 25, 50],
  magaza_alisverisi: [5, 10, 20],
  mesajlasma: [10, 20, 30],
};

// Rozetlerin görünen adı/açıklaması/ikonu — sabit referans veri (bkz.
// src/lib/fitnessExercises.ts'teki aynı hardcoded katalog deseni). Hesaplama
// SUNUCUDA (check_my_badges) yapılıyor, burası SADECE görüntüleme metadata'sı.
// title KISA VE YARATICI bir lakap (kullanıcı isteği) — sayıyı/detayı
// description'da veriyoruz, başlıkta tekrar etmiyoruz.
type VisualTier = "bronze" | "silver" | "gold";

// title artık RAKAM değil, zaten hesaplanmış GÖRSEL SEVİYE (bronze/silver/
// gold) alıyor — eşik sayıları admin tarafından değiştirilebildiği için
// (bkz. badgeTierSettings.ts) burada eşiği tekrar hardcoded varsaymak
// yanlış sonuç verirdi. description hâlâ ham sayıyı gösteriyor (her zaman
// doğru, çünkü gerçekte ulaşılan sayı).
export const BADGE_CATALOG: Record<BadgeType, { title: (level: VisualTier) => string; icon: string; description: (tier: number) => string }> = {
  antrenman_serisi: {
    title: (l) => (l === "gold" ? "Demir Disiplin" : l === "silver" ? "Kararlı" : "Azimli"),
    icon: "🔥",
    description: (t) => `Kesintisiz ${t} antrenmana katıldın.`,
  },
  grup_fitness: {
    title: (l) => (l === "gold" ? "Fitness Canavarı" : l === "silver" ? "Güçlü" : "Formda"),
    icon: "💪",
    description: (t) => `${t} grup fitness antrenmanı tamamladın.`,
  },
  bireysel_fitness: {
    title: (l) => (l === "gold" ? "Bağımsız Savaşçı" : l === "silver" ? "Öz Disiplin" : "Kendi Yolunda"),
    icon: "🏋️",
    description: (t) => `${t} gün bireysel fitness çalışması yaptın.`,
  },
  kulup_kidem: {
    title: (l) => (l === "gold" ? "Kıdemli" : l === "silver" ? "Kulübün Bir Parçası" : "Yeni Nesil"),
    icon: "🎖️",
    description: (t) => `Kulüpte ${t}. yılın!`,
  },
  sampiyon: {
    title: () => "Şampiyon",
    icon: "🏆",
    description: () => "Tebrikler Şampiyon! Emeğinin karşılığını aldın.",
  },
  sosyal_paylasim: {
    title: (l) => (l === "gold" ? "Sosyal Medya Fenomeni" : l === "silver" ? "Sosyal Yıldız" : "Paylaşımcı"),
    icon: "📸",
    description: (t) => `Sosyal Alan'da ${t} paylaşım yaptın.`,
  },
  magaza_alisverisi: {
    title: (l) => (l === "gold" ? "VIP Alıcı" : l === "silver" ? "Sadık Müşteri" : "Alışverişçi"),
    icon: "🛍️",
    description: (t) => `Mağazadan ${t} ürün aldın.`,
  },
  mesajlasma: {
    title: (l) => (l === "gold" ? "Herkesin Arkadaşı" : l === "silver" ? "İletişim Ustası" : "Sosyal Kelebek"),
    icon: "💬",
    description: (t) => `${t} farklı kişiyle mesajlaştın.`,
  },
};

// Tier'e göre görsel yükseliş — en yüksek tier her kategoride "gösterişli"
// olsun isteniyordu (bkz. kullanıcı isteği). Şampiyon rozeti tier'siz
// (her zaman tek), o da en gösterişli (glow) grupta. `clubTiers` verilirse
// (kulübün özelleştirdiği eşikler) onlara göre, yoksa varsayılanlara göre
// karşılaştırır.
export function badgeVisualTier(
  badge: Pick<Badge, "badge_type" | "tier">,
  clubTiers?: Partial<Record<AutoBadgeType, TierThresholds>>
): VisualTier {
  if (badge.badge_type === "sampiyon") return "gold";
  const [, t2, t3] = clubTiers?.[badge.badge_type] ?? DEFAULT_BADGE_TIERS[badge.badge_type];
  return badge.tier >= t3 ? "gold" : badge.tier >= t2 ? "silver" : "bronze";
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
// Kullanıcı isteği: fark daha belirgin olsun — bronz aynı kalıyor, gümüş
// ve altın daha da büyütüldü.
export function badgeIconSize(tierLevel: "bronze" | "silver" | "gold", base: number): number {
  return tierLevel === "gold" ? Math.round(base * 1.7) : tierLevel === "silver" ? Math.round(base * 1.35) : base;
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
