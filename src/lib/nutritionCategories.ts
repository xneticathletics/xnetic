import { colors } from "../theme/tokens";

// Besinler ekranındaki 4 sabit kategori kutusu — her biri kendi rengi ve
// simgesiyle, görsel olarak birbirinden ayrışsın diye.
export const FOOD_CATEGORIES = [
  { key: "karbonhidrat", label: "Karbonhidratlar", icon: "🍞", color: colors.yellow, soft: colors.yellowSoft },
  { key: "protein", label: "Proteinler", icon: "🍗", color: colors.coral, soft: colors.coralSoft },
  { key: "yag", label: "Yağlar", icon: "🥑", color: colors.violet, soft: `${colors.violet}22` },
  { key: "vitamin", label: "Vitaminler", icon: "🍊", color: colors.teal, soft: colors.tealSoft },
] as const;

export type FoodCategoryKey = (typeof FOOD_CATEGORIES)[number]["key"];

export function getFoodCategory(key: string) {
  return FOOD_CATEGORIES.find((c) => c.key === key) ?? FOOD_CATEGORIES[0];
}

// Beslenme Rehberi kategorileri (3 gün + genç sporcu konu başlıkları).
export const ARTICLE_CATEGORIES = [
  { key: "musabaka_gunu", label: "Müsabaka Günü Beslenmesi", icon: "🏆", color: colors.coral, soft: colors.coralSoft },
  { key: "antrenman_gunu", label: "Antrenman Günü Beslenmesi", icon: "💪", color: colors.teal, soft: colors.tealSoft },
  { key: "normal_gun", label: "Normal Gün Beslenmesi", icon: "🍽️", color: colors.yellow, soft: colors.yellowSoft },
  // Çocuk ve genç sporcu beslenmesi konu başlıkları (kaynaklı, global yazılar).
  { key: "genc_beslenme_temeli", label: "Genç Sporcunun Beslenme Temeli", icon: "🥗", color: colors.teal, soft: colors.tealSoft },
  { key: "protein", label: "Protein: Ne Kadar Yeterli?", icon: "🍗", color: colors.coral, soft: colors.coralSoft },
  { key: "su_sivi", label: "Su ve Sıvı Dengesi", icon: "💧", color: colors.violet, soft: colors.violetSoft },
  { key: "enerji_icecekleri", label: "Enerji ve Spor İçecekleri", icon: "🥤", color: colors.yellow, soft: colors.yellowSoft },
  { key: "kahvalti", label: "Kahvaltı", icon: "🍳", color: colors.coral, soft: colors.coralSoft },
  { key: "kemik_sagligi", label: "Kemik Sağlığı: Kalsiyum, D Vitamini, Demir", icon: "🦴", color: colors.violet, soft: colors.violetSoft },
  { key: "yetersiz_enerji", label: "Yetersiz Enerji Alımı (RED-S)", icon: "⚠️", color: colors.teal, soft: colors.tealSoft },
  { key: "uyku_beslenme", label: "Uyku ve Beslenme", icon: "😴", color: colors.yellow, soft: colors.yellowSoft },
] as const;

export type ArticleCategoryKey = (typeof ARTICLE_CATEGORIES)[number]["key"];

export function getArticleCategory(key: string) {
  return ARTICLE_CATEGORIES.find((c) => c.key === key) ?? ARTICLE_CATEGORIES[0];
}
