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

// Beslenme Rehberi'ndeki 3 sabit gün kategorisi.
export const ARTICLE_CATEGORIES = [
  { key: "musabaka_gunu", label: "Müsabaka Günü Beslenmesi", icon: "🏆", color: colors.coral, soft: colors.coralSoft },
  { key: "antrenman_gunu", label: "Antrenman Günü Beslenmesi", icon: "💪", color: colors.teal, soft: colors.tealSoft },
  { key: "normal_gun", label: "Normal Gün Beslenmesi", icon: "🍽️", color: colors.yellow, soft: colors.yellowSoft },
] as const;

export type ArticleCategoryKey = (typeof ARTICLE_CATEGORIES)[number]["key"];

export function getArticleCategory(key: string) {
  return ARTICLE_CATEGORIES.find((c) => c.key === key) ?? ARTICLE_CATEGORIES[0];
}
