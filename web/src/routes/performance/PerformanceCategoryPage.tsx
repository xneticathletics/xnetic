import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { COLOR_CLASSES, getPerformanceCategory } from "../../lib/performanceTests";
import { listTestsByCategory, deleteCustomTest, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";

export default function PerformanceCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const meta = getPerformanceCategory(category ?? "");

  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!category) return;
    setLoading(true);
    listTestsByCategory(category)
      .then(setTests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [category]);

  const handleDeleteTest = async (test: CustomPerformanceTest) => {
    if (!confirm(`"${test.name}" testi silinecek. Emin misin?`)) return;
    try {
      await deleteCustomTest(test.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  if (!meta) {
    return <p className="text-sm font-semibold text-coral">Kategori bulunamadı.</p>;
  }

  const cls = COLOR_CLASSES[meta.color];

  return (
    <div>
      <Link to="/performance" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Performans Ölçümleri
      </Link>

      <div className="mb-4 flex justify-end">
        <Link to="/performance/tests/new" className="rounded-lg border border-yellow px-4 py-2 text-sm font-bold text-yellow">
          + Test Ekle
        </Link>
      </div>

      <div className={`mb-6 rounded-xl border-2 ${cls.border} ${cls.bgSoft} p-6 text-center`}>
        <div className="mb-1 text-4xl">{meta.icon}</div>
        <div className={`text-lg font-extrabold ${cls.text}`}>{meta.label}</div>
        <div className="mt-1 text-xs text-muted">Kolaydan zora sıralı — bir test seç</div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}
      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}

      <div className="space-y-2">
        {!loading && tests.length === 0 && <p className="text-sm text-muted">Bu kategoride henüz test yok.</p>}
        {tests.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${cls.bgSoft} ${cls.text}`}>
              {i + 1}
            </div>
            <Link to={`/performance/${meta.key}/custom:${t.id}`} className="flex-1 hover:underline">
              <div className="text-sm font-bold text-ink">{t.name}</div>
              {t.equipment && <div className="mt-0.5 text-xs text-muted">🔧 {t.equipment}</div>}
            </Link>
            <div className={`text-xs font-bold ${cls.text}`}>{t.unit}</div>
            <Link to={`/performance/tests/${t.id}/edit`} className="text-xs font-bold text-teal hover:underline">
              Düzenle
            </Link>
            <button onClick={() => handleDeleteTest(t)} className="text-xs font-bold text-coral hover:underline">
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
