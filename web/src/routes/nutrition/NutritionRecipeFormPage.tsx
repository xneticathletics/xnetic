import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import FormField, { inputClass } from "../../components/FormField";
import {
  getNutritionRecipe,
  createNutritionRecipe,
  updateNutritionRecipe,
  type NutritionRecipeInput,
} from "../../lib/api/nutritionRecipes";
import { FOOD_CATEGORIES, type FoodCategoryKey } from "../../lib/nutritionCategories";

export default function NutritionRecipeFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id;

  const initialCategory = (searchParams.get("category") as FoodCategoryKey) || FOOD_CATEGORIES[0].key;

  const [category, setCategory] = useState<FoodCategoryKey>(initialCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getNutritionRecipe(id)
      .then((r) => {
        setCategory(r.category);
        setTitle(r.title);
        setDescription(r.description ?? "");
        setIngredients(r.ingredients ?? "");
        setInstructions(r.instructions ?? "");
        setSource(r.source ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) return setError("Tarif adı zorunludur.");
    setSaving(true);
    setError(null);
    try {
      const input: NutritionRecipeInput = {
        category,
        title: title.trim(),
        description: description.trim() || null,
        ingredients: ingredients.trim() || null,
        instructions: instructions.trim() || null,
        source: source.trim() || null,
      };
      if (id) await updateNutritionRecipe(id, input);
      else await createNutritionRecipe(input);
      navigate("/nutrition/recipes");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Yükleniyor…</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">{isNew ? "Yeni Tarif" : "Tarifi Düzenle"}</h1>
        <button onClick={() => navigate("/nutrition/recipes")} className="text-sm font-semibold text-muted hover:text-ink">
          ← Listeye Dön
        </button>
      </div>

      <FormField label="Kategori *">
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as FoodCategoryKey)}>
          {FOOD_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tarif Adı *">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Yulaflı Muzlu Kahvaltı Kasesi" autoFocus />
      </FormField>

      <FormField label="Kısa Açıklama">
        <textarea className={`${inputClass} h-16`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bu tarif ne için iyi?" />
      </FormField>

      <FormField label="Malzemeler">
        <textarea
          className={`${inputClass} h-28`}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Her satıra bir malzeme yazabilirsin"
        />
      </FormField>

      <FormField label="Yapılışı">
        <textarea
          className={`${inputClass} h-48`}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Adım adım hazırlanışı"
        />
      </FormField>

      <FormField label="Kaynakça">
        <textarea className={`${inputClass} h-16`} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Varsa dayandığı kaynak" />
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || !title.trim()}
        className="w-full rounded-lg bg-teal py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
