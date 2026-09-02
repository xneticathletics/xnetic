import { supabase } from "../supabase";
import type { ArticleCategoryKey } from "../nutritionCategories";

export type NutritionArticle = {
  id: string;
  category: ArticleCategoryKey;
  title: string;
  body: string;
  source: string | null;
  created_at: string;
};

export type NutritionArticleInput = {
  category: ArticleCategoryKey;
  title: string;
  body: string;
  source: string | null;
};

const NUTRITION_ARTICLE_FIELDS = "id, category, title, body, source, created_at";

export async function listNutritionArticlesByCategory(category: ArticleCategoryKey): Promise<NutritionArticle[]> {
  const { data, error } = await supabase
    .from("nutrition_articles")
    .select(NUTRITION_ARTICLE_FIELDS)
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as NutritionArticle[]) ?? [];
}

export async function getNutritionArticle(id: string): Promise<NutritionArticle> {
  const { data, error } = await supabase.from("nutrition_articles").select(NUTRITION_ARTICLE_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data as unknown as NutritionArticle;
}

export async function createNutritionArticle(input: NutritionArticleInput) {
  const { data, error } = await supabase.from("nutrition_articles").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateNutritionArticle(id: string, input: NutritionArticleInput) {
  const { data, error } = await supabase.from("nutrition_articles").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteNutritionArticle(id: string) {
  const { error } = await supabase.from("nutrition_articles").delete().eq("id", id);
  if (error) throw error;
}
