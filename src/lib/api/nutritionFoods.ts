import { supabase } from "../supabase";
import type { FoodCategoryKey } from "../nutritionCategories";

export type NutritionFood = {
  id: string;
  club_id: string | null;
  category: FoodCategoryKey;
  name: string;
  description: string | null;
  found_in: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  benefit: string | null;
  source: string | null;
  created_at: string;
  // Süper Admin, global olmayan satırlarda hangi kulübün eklediğini görebilsin
  // diye — bkz. customFitnessExercises.ts'teki aynı desen.
  clubs?: { name: string } | null;
};

export type NutritionFoodInput = {
  category: FoodCategoryKey;
  name: string;
  description: string | null;
  found_in: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  benefit: string | null;
  source: string | null;
};

const NUTRITION_FOOD_FIELDS =
  "id, club_id, category, name, description, found_in, calories, protein_g, carbs_g, fat_g, benefit, source, created_at";

export async function listNutritionFoodsByCategory(category: FoodCategoryKey): Promise<NutritionFood[]> {
  const { data, error } = await supabase
    .from("nutrition_foods")
    .select(`${NUTRITION_FOOD_FIELDS}, clubs(name)`)
    .eq("category", category)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as unknown as NutritionFood[]) ?? [];
}

export async function getNutritionFood(id: string): Promise<NutritionFood> {
  const { data, error } = await supabase.from("nutrition_foods").select(`${NUTRITION_FOOD_FIELDS}, clubs(name)`).eq("id", id).single();
  if (error) throw error;
  return data as unknown as NutritionFood;
}

export async function createNutritionFood(input: NutritionFoodInput) {
  const { data, error } = await supabase.from("nutrition_foods").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateNutritionFood(id: string, input: NutritionFoodInput) {
  const { data, error } = await supabase.from("nutrition_foods").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteNutritionFood(id: string) {
  const { error } = await supabase.from("nutrition_foods").delete().eq("id", id);
  if (error) throw error;
}
