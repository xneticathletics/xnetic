import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { COLOR_CLASSES, getPerformanceCategory } from "../../lib/performanceTests";
import { listTestsByCategory, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";

export default function PerformanceCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const meta = getPerformanceCategory(category ?? "");

  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    listTestsByCategory(category)
      .then(setTests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  if (!meta) {
    return <p className="text-sm font-semibold text-coral">Kategori bulunamadı.</p>;
  }

  const cls = COLOR_CLASSES[meta.color];

  return (
    <div>
      <Link to="/performance" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Performans Ölçümleri
      </Link>

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
          <Link
            key={t.id}
            to={`/performance/${meta.key}/custom:${t.id}`}
            className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:bg-surface/60"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${cls.bgSoft} ${cls.text}`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{t.name}</div>
              {t.equipment && <div className="mt-0.5 text-xs text-muted">🔧 {t.equipment}</div>}
            </div>
            <div className={`text-xs font-bold ${cls.text}`}>{t.unit}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
