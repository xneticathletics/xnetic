import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { listNutritionArticlesByCategory, deleteNutritionArticle, type NutritionArticle } from "../../lib/api/nutritionArticles";
import { ARTICLE_CATEGORIES, CATEGORY_COLOR_CLASSES, type ArticleCategoryKey } from "../../lib/nutritionCategories";

export default function NutritionArticlesPage() {
  const [activeCategory, setActiveCategory] = useState<ArticleCategoryKey>(ARTICLE_CATEGORIES[0].key);
  const [articles, setArticles] = useState<NutritionArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (category: ArticleCategoryKey) => {
    setLoading(true);
    setError(null);
    listNutritionArticlesByCategory(category)
      .then(setArticles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(activeCategory), [activeCategory]);

  const handleDelete = async (a: NutritionArticle) => {
    if (!confirm(`"${a.title}" adlı yazıyı silmek istediğine emin misin?`)) return;
    try {
      await deleteNutritionArticle(a.id);
      load(activeCategory);
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<NutritionArticle>[] = [
    { key: "title", label: "Başlık", render: (a) => <span className="font-semibold">{a.title}</span> },
    {
      key: "body",
      label: "İçerik",
      render: (a) => <span className="line-clamp-2 text-muted">{a.body}</span>,
    },
    { key: "source", label: "Kaynakça", render: (a) => a.source ?? "—" },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Link to={`/nutrition/articles/${a.id}`} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </Link>
          <button onClick={() => handleDelete(a)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Beslenme Rehberi</h1>
        <Link
          to={`/nutrition/articles/new?category=${activeCategory}`}
          className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg"
        >
          + Yazı Ekle
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ARTICLE_CATEGORIES.map((c) => {
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

      <DataTable columns={columns} rows={articles} rowKey={(a) => a.id} loading={loading} emptyText="Bu kategoride henüz yazı eklenmemiş." />
    </div>
  );
}
