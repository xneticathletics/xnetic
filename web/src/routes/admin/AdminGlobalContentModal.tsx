import { useRef, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { FITNESS_CATEGORIES } from "../../lib/fitnessExercises";
import { FOOD_CATEGORIES } from "../../lib/nutritionCategories";
import { PERFORMANCE_CATEGORIES } from "../../lib/performanceTests";
import {
  createCustomExercise, updateCustomExercise, uploadExerciseVideo, type CustomFitnessExercise,
} from "../../lib/api/fitnessExercises";
import { createNutritionFood, updateNutritionFood, type NutritionFood } from "../../lib/api/nutritionFoods";
import { createNutritionRecipe, updateNutritionRecipe, type NutritionRecipe } from "../../lib/api/nutritionRecipes";
import { createCustomTest, updateCustomTest, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";
import type { PromotableTable } from "../../lib/api/superAdmin";

type GlobalItem = CustomFitnessExercise | NutritionFood | NutritionRecipe | CustomPerformanceTest;

function toNumberOrNull(v: string): number | null {
  const trimmed = v.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// Süper Admin'in İçerik Kütüphanesi'ndeki "Mevcut İçerik" sekmesinde global
// (club_id NULL) bir kaydı eklemek/düzenlemek için — 4 farklı tablo şekli
// (fitness_exercises/nutrition_foods/nutrition_recipes/performance_test_catalog)
// tek modalde, kategoriden bağımsız bir kütüphane görünümü olduğu için
// (club sayfalarındaki ExerciseModal/NutritionFoodsPage modalinin aksine)
// burada ayrıca bir kategori seçici de var.
export default function AdminGlobalContentModal({
  table,
  item,
  onClose,
  onSaved,
}: {
  table: PromotableTable;
  item: GlobalItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !item;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fitness_exercises
  const ex = table === "fitness_exercises" ? (item as CustomFitnessExercise | null) : null;
  const [exCategory, setExCategory] = useState(ex?.category ?? FITNESS_CATEGORIES[0].key);
  const [exName, setExName] = useState(ex?.name ?? "");
  const [exBodyweight, setExBodyweight] = useState(ex?.bodyweight ?? false);
  const [exDescription, setExDescription] = useState(ex?.description ?? "");
  const [exVideoUrl, setExVideoUrl] = useState(ex?.video_url ?? "");

  // nutrition_foods
  const food = table === "nutrition_foods" ? (item as NutritionFood | null) : null;
  const [foodCategory, setFoodCategory] = useState<string>(food?.category ?? FOOD_CATEGORIES[0].key);
  const [foodName, setFoodName] = useState(food?.name ?? "");
  const [foodDescription, setFoodDescription] = useState(food?.description ?? "");
  const [foodFoundIn, setFoodFoundIn] = useState(food?.found_in ?? "");
  const [foodCalories, setFoodCalories] = useState(food?.calories != null ? String(food.calories) : "");
  const [foodProtein, setFoodProtein] = useState(food?.protein_g != null ? String(food.protein_g) : "");
  const [foodCarbs, setFoodCarbs] = useState(food?.carbs_g != null ? String(food.carbs_g) : "");
  const [foodFat, setFoodFat] = useState(food?.fat_g != null ? String(food.fat_g) : "");
  const [foodBenefit, setFoodBenefit] = useState(food?.benefit ?? "");
  const [foodSource, setFoodSource] = useState(food?.source ?? "");

  // nutrition_recipes
  const recipe = table === "nutrition_recipes" ? (item as NutritionRecipe | null) : null;
  const [recipeCategory, setRecipeCategory] = useState<string>(recipe?.category ?? FOOD_CATEGORIES[0].key);
  const [recipeTitle, setRecipeTitle] = useState(recipe?.title ?? "");
  const [recipeDescription, setRecipeDescription] = useState(recipe?.description ?? "");
  const [recipeIngredients, setRecipeIngredients] = useState(recipe?.ingredients ?? "");
  const [recipeInstructions, setRecipeInstructions] = useState(recipe?.instructions ?? "");
  const [recipeSource, setRecipeSource] = useState(recipe?.source ?? "");

  // performance_test_catalog
  const test = table === "performance_test_catalog" ? (item as CustomPerformanceTest | null) : null;
  const [testCategory, setTestCategory] = useState(test?.category ?? PERFORMANCE_CATEGORIES[0].key);
  const [testName, setTestName] = useState(test?.name ?? "");
  const [testUnit, setTestUnit] = useState(test?.unit ?? "");
  const [testEquipment, setTestEquipment] = useState(test?.equipment ?? "");
  const [testInstructions, setTestInstructions] = useState(test?.instructions ?? "");
  const [testVideoUrl, setTestVideoUrl] = useState(test?.video_url ?? "");

  const handleExerciseVideoSelect = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setExVideoUrl(await uploadExerciseVideo(file, null));
    } catch (e: any) {
      setError(e.message ?? "Video yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const title =
    table === "fitness_exercises" ? (isNew ? "Yeni Global Hareket" : "Hareketi Düzenle") :
    table === "nutrition_foods" ? (isNew ? "Yeni Global Besin" : "Besini Düzenle") :
    table === "nutrition_recipes" ? (isNew ? "Yeni Global Tarif" : "Tarifi Düzenle") :
    isNew ? "Yeni Global Test" : "Testi Düzenle";

  const handleSave = async () => {
    setError(null);
    try {
      if (table === "fitness_exercises") {
        if (!exName.trim()) return setError("Hareketin adını girmelisin.");
        const input = { category: exCategory, name: exName.trim(), bodyweight: exBodyweight, video_url: exVideoUrl.trim() || null, description: exDescription.trim() || null };
        setSaving(true);
        if (ex) await updateCustomExercise(ex.id, input);
        else await createCustomExercise(input);
      } else if (table === "nutrition_foods") {
        if (!foodName.trim()) return setError("Besin adını girmelisin.");
        const input = {
          category: foodCategory as any, name: foodName.trim(), description: foodDescription.trim() || null,
          found_in: foodFoundIn.trim() || null, calories: toNumberOrNull(foodCalories), protein_g: toNumberOrNull(foodProtein),
          carbs_g: toNumberOrNull(foodCarbs), fat_g: toNumberOrNull(foodFat), benefit: foodBenefit.trim() || null, source: foodSource.trim() || null,
        };
        setSaving(true);
        if (food) await updateNutritionFood(food.id, input);
        else await createNutritionFood(input);
      } else if (table === "nutrition_recipes") {
        if (!recipeTitle.trim()) return setError("Tarif adını girmelisin.");
        const input = {
          category: recipeCategory as any, title: recipeTitle.trim(), description: recipeDescription.trim() || null,
          ingredients: recipeIngredients.trim() || null, instructions: recipeInstructions.trim() || null, source: recipeSource.trim() || null,
        };
        setSaving(true);
        if (recipe) await updateNutritionRecipe(recipe.id, input);
        else await createNutritionRecipe(input);
      } else {
        if (!testName.trim()) return setError("Testin adını girmelisin.");
        if (!testUnit.trim()) return setError("Birim girmelisin.");
        if (!testInstructions.trim()) return setError("Uygulama talimatını girmelisin.");
        const input = {
          category: testCategory, name: testName.trim(), unit: testUnit.trim(),
          equipment: testEquipment.trim() || null, instructions: testInstructions.trim(), video_url: testVideoUrl.trim() || null,
        };
        setSaving(true);
        if (test) await updateCustomTest(test.id, input);
        else await createCustomTest(input);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      {table === "fitness_exercises" && (
        <>
          <FormField label="Bölge *">
            <select className={inputClass} value={exCategory} onChange={(e) => setExCategory(e.target.value)}>
              {FITNESS_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Hareketin Adı *">
            <input className={inputClass} value={exName} onChange={(e) => setExName(e.target.value)} placeholder="Örn. Cable Crossover" autoFocus />
          </FormField>
          <FormField label="Açıklama">
            <textarea className={`${inputClass} min-h-20`} value={exDescription} onChange={(e) => setExDescription(e.target.value)} placeholder="Hareketin nasıl yapıldığına dair kısa bir açıklama…" />
          </FormField>
          <FormField label="Video">
            <input className={inputClass} value={exVideoUrl} onChange={(e) => setExVideoUrl(e.target.value)} placeholder="Video linki yapıştır (YouTube, Vimeo, vb.)" />
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink disabled:opacity-60">
                {uploading ? "Yükleniyor…" : "📁 Dosya Seç ve Yükle"}
              </button>
              {exVideoUrl && (
                <button type="button" onClick={() => setExVideoUrl("")} className="text-xs font-bold text-coral hover:underline">Kaldır</button>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleExerciseVideoSelect(e.target.files?.[0])} />
            </div>
          </FormField>
          <FormField label="Vücut Ağırlığı">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" checked={exBodyweight} onChange={(e) => setExBodyweight(e.target.checked)} />
              Vücut ağırlığıyla yapılır — ağırlık alanı isteğe bağlı olsun
            </label>
          </FormField>
        </>
      )}

      {table === "nutrition_foods" && (
        <>
          <FormField label="Kategori *">
            <select className={inputClass} value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Besin Adı *">
            <input className={inputClass} value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="Örn. Yulaf" autoFocus />
          </FormField>
          <FormField label="Kısa Açıklama">
            <textarea className={`${inputClass} h-16`} value={foodDescription} onChange={(e) => setFoodDescription(e.target.value)} />
          </FormField>
          <FormField label="Nerede Bulunur">
            <textarea className={`${inputClass} h-16`} value={foodFoundIn} onChange={(e) => setFoodFoundIn(e.target.value)} placeholder="Örn. Portakal, kivi, kırmızı biber" />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Kalori">
              <input className={inputClass} value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)} inputMode="decimal" />
            </FormField>
            <FormField label="Protein (g)">
              <input className={inputClass} value={foodProtein} onChange={(e) => setFoodProtein(e.target.value)} inputMode="decimal" />
            </FormField>
            <FormField label="Karbonhidrat (g)">
              <input className={inputClass} value={foodCarbs} onChange={(e) => setFoodCarbs(e.target.value)} inputMode="decimal" />
            </FormField>
            <FormField label="Yağ (g)">
              <input className={inputClass} value={foodFat} onChange={(e) => setFoodFat(e.target.value)} inputMode="decimal" />
            </FormField>
          </div>
          <FormField label="Sporcuya Faydası">
            <textarea className={`${inputClass} h-16`} value={foodBenefit} onChange={(e) => setFoodBenefit(e.target.value)} />
          </FormField>
          <FormField label="Kaynakça">
            <textarea className={`${inputClass} h-16`} value={foodSource} onChange={(e) => setFoodSource(e.target.value)} />
          </FormField>
        </>
      )}

      {table === "nutrition_recipes" && (
        <>
          <FormField label="Kategori *">
            <select className={inputClass} value={recipeCategory} onChange={(e) => setRecipeCategory(e.target.value)}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tarif Adı *">
            <input className={inputClass} value={recipeTitle} onChange={(e) => setRecipeTitle(e.target.value)} placeholder="Örn. Izgara Tavuklu Kinoa Salatası" autoFocus />
          </FormField>
          <FormField label="Açıklama">
            <textarea className={`${inputClass} h-16`} value={recipeDescription} onChange={(e) => setRecipeDescription(e.target.value)} />
          </FormField>
          <FormField label="Malzemeler">
            <textarea className={`${inputClass} h-24`} value={recipeIngredients} onChange={(e) => setRecipeIngredients(e.target.value)} placeholder="Her satıra bir malzeme" />
          </FormField>
          <FormField label="Hazırlanışı">
            <textarea className={`${inputClass} h-24`} value={recipeInstructions} onChange={(e) => setRecipeInstructions(e.target.value)} />
          </FormField>
          <FormField label="Kaynakça">
            <textarea className={`${inputClass} h-16`} value={recipeSource} onChange={(e) => setRecipeSource(e.target.value)} />
          </FormField>
        </>
      )}

      {table === "performance_test_catalog" && (
        <>
          <FormField label="Kategori *">
            <select className={inputClass} value={testCategory} onChange={(e) => setTestCategory(e.target.value)}>
              {PERFORMANCE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Testin Adı *">
            <input className={inputClass} value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Örn. 20m Sürat" autoFocus />
          </FormField>
          <FormField label="Birim *">
            <input className={inputClass} value={testUnit} onChange={(e) => setTestUnit(e.target.value)} placeholder="Örn. saniye, cm, tekrar" />
          </FormField>
          <FormField label="Ekipman">
            <input className={inputClass} value={testEquipment} onChange={(e) => setTestEquipment(e.target.value)} placeholder="Örn. Kronometre" />
          </FormField>
          <FormField label="Nasıl Yapılır? *">
            <textarea className={`${inputClass} h-24`} value={testInstructions} onChange={(e) => setTestInstructions(e.target.value)} />
          </FormField>
          <FormField label="Video">
            <input className={inputClass} value={testVideoUrl} onChange={(e) => setTestVideoUrl(e.target.value)} placeholder="Video linki yapıştır (YouTube, Vimeo, vb.)" />
          </FormField>
        </>
      )}

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button onClick={handleSave} disabled={saving || uploading} className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60">
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </Modal>
  );
}
