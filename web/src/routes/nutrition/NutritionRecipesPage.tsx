import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { listNutritionRecipesByCategory, deleteNutritionRecipe, type NutritionRecipe } from "../../lib/api/nutritionRecipes";
import { FOOD_CATEGORIES, CATEGORY_COLOR_CLASSES, type FoodCategoryKey } from "../../lib/nutritionCategories";

export default function NutritionRecipesPage() {
  const [activeCategory, setActiveCategory] = useState<FoodCategoryKey>(FOOD_CATEGORIES[0].key);
  const [recipes, setRecipes] = useState<NutritionRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (category: FoodCategoryKey) => {
    setLoading(true);
    setError(null);
    listNutritionRecipesByCategory(category)
      .then(setRecipes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(activeCategory), [activeCategory]);

  const handleDelete = async (r: NutritionRecipe) => {
    if (!confirm(`"${r.title}" adlı tarifi silmek istediğine emin misin?`)) return;
    try {
      await deleteNutritionRecipe(r.id);
      load(activeCategory);
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<NutritionRecipe>[] = [
    { key: "title", label: "Tarif", render: (r) => <span className="font-semibold">🍳 {r.title}</span> },
    {
      key: "description",
      label: "Açıklama",
      render: (r) => (r.description ? <span className="line-clamp-2">{r.description}</span> : "—"),
    },
    { key: "source", label: "Kaynakça", render: (r) => r.source ?? "—" },
    {
      key: "origin",
      label: "Kaynak",
      render: (r) => (r.club_id !== null ? <span className="text-violet">Kulübe özel</span> : <span className="text-xs text-muted">—</span>),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Link to={`/nutrition/recipes/${r.id}`} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </Link>
          {r.club_id !== null && (
            <button onClick={() => handleDelete(r)} className="text-xs font-bold text-coral hover:underline">
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
        <h1 className="text-xl font-bold text-ink">Sporcu Tarifleri</h1>
        <Link
          to={`/nutrition/recipes/new?category=${activeCategory}`}
          className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg"
        >
          + Tarif Ekle
        </Link>
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

      <DataTable columns={columns} rows={recipes} rowKey={(r) => r.id} loading={loading} emptyText="Bu kategoride henüz tarif eklenmemiş." />
    </div>
  );
}
