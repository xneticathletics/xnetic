import { supabase } from "../supabase";
import type { FoodCategoryKey } from "../nutritionCategories";

export type NutritionRecipe = {
  id: string;
  club_id: string | null;
  category: FoodCategoryKey;
  title: string;
  description: string | null;
  ingredients: string | null;
  instructions: string | null;
  source: string | null;
  created_at: string;
  clubs?: { name: string } | null;
};

export type NutritionRecipeInput = {
  category: FoodCategoryKey;
  title: string;
  description: string | null;
  ingredients: string | null;
  instructions: string | null;
  source: string | null;
};

const NUTRITION_RECIPE_FIELDS = "id, club_id, category, title, description, ingredients, instructions, source, created_at";

export async function listNutritionRecipesByCategory(category: FoodCategoryKey): Promise<NutritionRecipe[]> {
  const { data, error } = await supabase
    .from("nutrition_recipes")
    .select(`${NUTRITION_RECIPE_FIELDS}, clubs(name)`)
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as NutritionRecipe[]) ?? [];
}

export async function getNutritionRecipe(id: string): Promise<NutritionRecipe> {
  const { data, error } = await supabase.from("nutrition_recipes").select(`${NUTRITION_RECIPE_FIELDS}, clubs(name)`).eq("id", id).single();
  if (error) throw error;
  return data as unknown as NutritionRecipe;
}

export async function createNutritionRecipe(input: NutritionRecipeInput) {
  const { data, error } = await supabase.from("nutrition_recipes").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateNutritionRecipe(id: string, input: NutritionRecipeInput) {
  const { data, error } = await supabase.from("nutrition_recipes").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteNutritionRecipe(id: string) {
  const { error } = await supabase.from("nutrition_recipes").delete().eq("id", id);
  if (error) throw error;
}
