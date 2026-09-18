// Besinler ekranındaki 4 sabit kategori — mobil uygulamadaki
// src/lib/nutritionCategories.ts ile birebir aynı key'ler ve sıra.
// Renkler mobildeki hex tokenlar yerine web tarafındaki Tailwind renk
// sınıflarına (index.css @theme) karşılık gelir.
export const FOOD_CATEGORIES = [
  { key: "karbonhidrat", label: "Karbonhidratlar", icon: "🍞", color: "yellow" },
  { key: "protein", label: "Proteinler", icon: "🍗", color: "coral" },
  { key: "yag", label: "Yağlar", icon: "🥑", color: "violet" },
  { key: "vitamin", label: "Vitaminler", icon: "🍊", color: "teal" },
] as const;

export type FoodCategoryKey = (typeof FOOD_CATEGORIES)[number]["key"];

export function getFoodCategory(key: string) {
  return FOOD_CATEGORIES.find((c) => c.key === key) ?? FOOD_CATEGORIES[0];
}

// Beslenme Rehberi kategorileri (3 gün + genç sporcu konu başlıkları).
export const ARTICLE_CATEGORIES = [
  { key: "musabaka_gunu", label: "Müsabaka Günü Beslenmesi", icon: "🏆", color: "coral" },
  { key: "antrenman_gunu", label: "Antrenman Günü Beslenmesi", icon: "💪", color: "teal" },
  { key: "normal_gun", label: "Normal Gün Beslenmesi", icon: "🍽️", color: "yellow" },
  // Çocuk ve genç sporcu beslenmesi konu başlıkları — mobildeki listeyle aynı key'ler.
  { key: "genc_beslenme_temeli", label: "Genç Sporcunun Beslenme Temeli", icon: "🥗", color: "teal" },
  { key: "protein", label: "Protein: Ne Kadar Yeterli?", icon: "🍗", color: "coral" },
  { key: "su_sivi", label: "Su ve Sıvı Dengesi", icon: "💧", color: "violet" },
  { key: "enerji_icecekleri", label: "Enerji ve Spor İçecekleri", icon: "🥤", color: "yellow" },
  { key: "kahvalti", label: "Kahvaltı", icon: "🍳", color: "coral" },
  { key: "kemik_sagligi", label: "Kemik Sağlığı: Kalsiyum, D Vitamini, Demir", icon: "🦴", color: "violet" },
  { key: "yetersiz_enerji", label: "Yetersiz Enerji Alımı (RED-S)", icon: "⚠️", color: "teal" },
  { key: "uyku_beslenme", label: "Uyku ve Beslenme", icon: "😴", color: "yellow" },
] as const;

export type ArticleCategoryKey = (typeof ARTICLE_CATEGORIES)[number]["key"];

export function getArticleCategory(key: string) {
  return ARTICLE_CATEGORIES.find((c) => c.key === key) ?? ARTICLE_CATEGORIES[0];
}

// Tailwind v4 sınıf isimlerini derleme zamanında taramak için literal
// string'ler olarak tanımlanmalı — template literal ile üretilen sınıf
// isimleri (`text-${color}`) taramada görünmez.
export type CategoryColor = (typeof FOOD_CATEGORIES)[number]["color"] | (typeof ARTICLE_CATEGORIES)[number]["color"];

export const CATEGORY_COLOR_CLASSES: Record<CategoryColor, { text: string; border: string; bg: string; soft: string }> = {
  yellow: { text: "text-yellow", border: "border-yellow", bg: "bg-yellow", soft: "bg-yellow/15" },
  coral: { text: "text-coral", border: "border-coral", bg: "bg-coral", soft: "bg-coral/15" },
  violet: { text: "text-violet", border: "border-violet", bg: "bg-violet", soft: "bg-violet/15" },
  teal: { text: "text-teal", border: "border-teal", bg: "bg-teal", soft: "bg-teal/15" },
};
