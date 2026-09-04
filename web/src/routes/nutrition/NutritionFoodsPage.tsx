import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  listNutritionFoodsByCategory,
  createNutritionFood,
  updateNutritionFood,
  deleteNutritionFood,
  type NutritionFood,
  type NutritionFoodInput,
} from "../../lib/api/nutritionFoods";
import { FOOD_CATEGORIES, CATEGORY_COLOR_CLASSES, type FoodCategoryKey } from "../../lib/nutritionCategories";

function emptyForm(category: FoodCategoryKey): NutritionFoodInput {
  return {
    category,
    name: "",
    description: null,
    found_in: null,
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    benefit: null,
    source: null,
  };
}

function toNumberOrNull(v: string): number | null {
  const trimmed = v.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function NutritionFoodsPage() {
  const [activeCategory, setActiveCategory] = useState<FoodCategoryKey>(FOOD_CATEGORIES[0].key);
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<NutritionFoodInput>(emptyForm(activeCategory));
  // Sayısal alanlar serbest metin olarak tutulur ki kullanıcı "1," yazarken
  // input anlık olarak sayıya zorlanıp kesilmesin.
  const [caloriesText, setCaloriesText] = useState("");
  const [proteinText, setProteinText] = useState("");
  const [carbsText, setCarbsText] = useState("");
  const [fatText, setFatText] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = (category: FoodCategoryKey) => {
    setLoading(true);
    setError(null);
    listNutritionFoodsByCategory(category)
      .then(setFoods)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(activeCategory), [activeCategory]);

  const openNew = () => {
    setForm(emptyForm(activeCategory));
    setCaloriesText("");
    setProteinText("");
    setCarbsText("");
    setFatText("");
    setFormError(null);
    setEditingId("new");
  };

  const openEdit = (f: NutritionFood) => {
    setForm({
      category: f.category,
      name: f.name,
      description: f.description,
      found_in: f.found_in,
      calories: f.calories,
      protein_g: f.protein_g,
      carbs_g: f.carbs_g,
      fat_g: f.fat_g,
      benefit: f.benefit,
      source: f.source,
    });
    setCaloriesText(f.calories != null ? String(f.calories) : "");
    setProteinText(f.protein_g != null ? String(f.protein_g) : "");
    setCarbsText(f.carbs_g != null ? String(f.carbs_g) : "");
    setFatText(f.fat_g != null ? String(f.fat_g) : "");
    setFormError(null);
    setEditingId(f.id);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError("Besin adı zorunludur.");
    setSaving(true);
    setFormError(null);
    try {
      const input: NutritionFoodInput = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        found_in: form.found_in?.trim() || null,
        calories: toNumberOrNull(caloriesText),
        protein_g: toNumberOrNull(proteinText),
        carbs_g: toNumberOrNull(carbsText),
        fat_g: toNumberOrNull(fatText),
        benefit: form.benefit?.trim() || null,
        source: form.source?.trim() || null,
      };
      if (editingId === "new") await createNutritionFood(input);
      else if (editingId) await updateNutritionFood(editingId, input);
      setEditingId(null);
      load(activeCategory);
    } catch (e: any) {
      setFormError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: NutritionFood) => {
    if (!confirm(`"${f.name}" adlı besini silmek istediğine emin misin?`)) return;
    try {
      await deleteNutritionFood(f.id);
      load(activeCategory);
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<NutritionFood>[] = [
    { key: "name", label: "Besin", render: (f) => <span className="font-semibold">{f.name}</span> },
    { key: "found_in", label: "Nerede Bulunur", render: (f) => f.found_in ?? "—" },
    {
      key: "macros",
      label: "Makrolar",
      render: (f) => {
        const parts: string[] = [];
        if (f.calories != null) parts.push(`${f.calories} kcal`);
        if (f.protein_g != null) parts.push(`P: ${f.protein_g}g`);
        if (f.carbs_g != null) parts.push(`K: ${f.carbs_g}g`);
        if (f.fat_g != null) parts.push(`Y: ${f.fat_g}g`);
        return parts.length ? parts.join(" · ") : "—";
      },
    },
    { key: "source", label: "Kaynakça", render: (f) => f.source ?? "—" },
    {
      key: "origin",
      label: "Kaynak",
      render: (f) => (f.club_id !== null ? <span className="text-violet">Kulübe özel</span> : <span className="text-xs text-muted">—</span>),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      // Var olan (global) besinleri her kulüp admini düzenleyebilir — silme,
      // kulübün KENDİ eklediği (club_id dolu) besinlerle sınırlı (bkz.
      // FitnessCategoryPage.tsx'teki aynı mantık).
      render: (f) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(f)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          {f.club_id !== null && (
            <button onClick={() => handleDelete(f)} className="text-xs font-bold text-coral hover:underline">
              Sil
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Besinler</h1>
        <button onClick={openNew} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Besin Ekle
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FOOD_CATEGORIES.map((c) => {
          const active = c.key === activeCategory;
          const cls = CATEGORY_COLOR_CLASSES[c.color];
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                active ? `${cls.border} ${cls.bg} text-bg` : "border-line text-muted"
              }`}
            >
              {c.icon} {c.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={foods} rowKey={(f) => f.id} loading={loading} emptyText="Bu kategoride henüz besin eklenmemiş." />

      {editingId && (
        <Modal title={editingId === "new" ? "Yeni Besin" : "Besini Düzenle"} onClose={() => setEditingId(null)}>
          <FormField label="Kategori *">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FoodCategoryKey }))}
            >
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Besin Adı *">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Örn. Yulaf"
              autoFocus
            />
          </FormField>

          <FormField label="Kısa Açıklama">
            <textarea
              className={`${inputClass} h-16`}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Besin hakkında kısa bir açıklama"
            />
          </FormField>

          <FormField label="Nerede Bulunur">
            <textarea
              className={`${inputClass} h-16`}
              value={form.found_in ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, found_in: e.target.value }))}
              placeholder="Örn. Portakal, kivi, kırmızı biber"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kalori">
              <input className={inputClass} value={caloriesText} onChange={(e) => setCaloriesText(e.target.value)} placeholder="Örn. 389" inputMode="decimal" />
            </FormField>
            <FormField label="Protein (g)">
              <input className={inputClass} value={proteinText} onChange={(e) => setProteinText(e.target.value)} placeholder="Örn. 17" inputMode="decimal" />
            </FormField>
            <FormField label="Karbonhidrat (g)">
              <input className={inputClass} value={carbsText} onChange={(e) => setCarbsText(e.target.value)} placeholder="Örn. 66" inputMode="decimal" />
            </FormField>
            <FormField label="Yağ (g)">
              <input className={inputClass} value={fatText} onChange={(e) => setFatText(e.target.value)} placeholder="Örn. 7" inputMode="decimal" />
            </FormField>
          </div>

          <FormField label="Sporcuya Faydası">
            <textarea
              className={`${inputClass} h-16`}
              value={form.benefit ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
              placeholder="Bu besin sporcuya nasıl fayda sağlar?"
            />
          </FormField>

          <FormField label="Kaynakça">
            <textarea
              className={`${inputClass} h-16`}
              value={form.source ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="Örn. Harvard T.H. Chan School of Public Health, 2023"
            />
          </FormField>

          {formError && <p className="mb-3 text-sm font-semibold text-coral">{formError}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </Modal>
      )}
    </div>
  );
}
