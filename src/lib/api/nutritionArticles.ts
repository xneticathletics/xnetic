import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import type { ArticleCategoryKey } from "../nutritionCategories";

export type NutritionArticle = {
  id: string;
  category: ArticleCategoryKey;
  title: string;
  body: string | null;
  pdf_url: string | null;
  source: string | null;
  created_at: string;
};

export type NutritionArticleInput = {
  category: ArticleCategoryKey;
  title: string;
  body: string | null;
  pdf_url: string | null;
  source: string | null;
};

const NUTRITION_ARTICLE_FIELDS = "id, category, title, body, pdf_url, source, created_at";

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

// "nutrition-pdfs" bucket'ında da bu değerle senkron (bkz.
// supabase/migrations/..._nutrition_articles_pdf_attachment.sql) — bir
// beslenme rehberi PDF'i için fazlasıyla yeterli bir üst sınır.
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

// Rehber PDF'ini yükler — kulübe özel bir yolda tutulur ("<clubId>/<dosya>.pdf"),
// bkz. clubLogo.ts'teki uploadClubLogo ile birebir aynı okuma deseni.
export async function uploadNutritionArticlePdf(localUri: string, clubId: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists && info.size > MAX_PDF_SIZE_BYTES) {
    throw new Error(`PDF en fazla ${MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
  }

  const path = `${clubId}/${Date.now()}.pdf`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from("nutrition-pdfs")
    .upload(path, arrayBuffer, { contentType: "application/pdf" });
  if (error) throw error;

  const { data } = supabase.storage.from("nutrition-pdfs").getPublicUrl(path);
  return data.publicUrl;
}
