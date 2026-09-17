import { supabase } from "../supabase";
import { getCurrentClubId } from "./currentUser";
import { DEFAULT_BADGE_TIERS, type AutoBadgeType, type TierThresholds } from "./badges";

export const AUTO_BADGE_TYPES: AutoBadgeType[] = [
  "antrenman_serisi",
  "grup_fitness",
  "bireysel_fitness",
  "kulup_kidem",
  "sosyal_paylasim",
  "magaza_alisverisi",
  "mesajlasma",
];

export const BADGE_TYPE_LABELS: Record<AutoBadgeType, string> = {
  antrenman_serisi: "Antrenman Serisi",
  grup_fitness: "Grup Fitness",
  bireysel_fitness: "Bireysel Fitness",
  kulup_kidem: "Kulüp Kıdemi (yıl)",
  sosyal_paylasim: "Sosyal Paylaşım",
  magaza_alisverisi: "Mağaza Alışverişi",
  mesajlasma: "Mesajlaşma",
};

export const BADGE_TYPE_UNITS: Record<AutoBadgeType, string> = {
  antrenman_serisi: "kesintisiz antrenman",
  grup_fitness: "tamamlanan program",
  bireysel_fitness: "çalışma günü",
  kulup_kidem: "yıl",
  sosyal_paylasim: "paylaşım",
  magaza_alisverisi: "ürün",
  mesajlasma: "farklı kişi",
};

type SettingsRow = { badge_type: AutoBadgeType; tier1: number; tier2: number; tier3: number };

// Kulübün özelleştirdiği eşikleri döner — override yoksa o kategori için
// varsayılan (hardcoded) üçlü döner, ekran her zaman 7 kategoriyi de görür.
export async function listBadgeTierSettings(): Promise<Record<AutoBadgeType, TierThresholds>> {
  const { data, error } = await supabase.from("badge_tier_settings").select("badge_type, tier1, tier2, tier3");
  if (error) throw error;
  const result = { ...DEFAULT_BADGE_TIERS };
  for (const row of (data as SettingsRow[]) ?? []) {
    result[row.badge_type] = [row.tier1, row.tier2, row.tier3];
  }
  return result;
}

export async function saveBadgeTierSetting(badgeType: AutoBadgeType, thresholds: TierThresholds): Promise<void> {
  const clubId = await getCurrentClubId();
  if (!clubId) throw new Error("Kulüp bulunamadı");
  const { error } = await supabase
    .from("badge_tier_settings")
    .upsert(
      { club_id: clubId, badge_type: badgeType, tier1: thresholds[0], tier2: thresholds[1], tier3: thresholds[2] },
      { onConflict: "club_id,badge_type" }
    );
  if (error) throw error;
}

// Kategoriyi varsayılana döndürür (override satırını siler).
export async function resetBadgeTierSetting(badgeType: AutoBadgeType): Promise<void> {
  const { error } = await supabase.from("badge_tier_settings").delete().eq("badge_type", badgeType);
  if (error) throw error;
}
