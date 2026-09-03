import { Link } from "react-router-dom";
import { COLOR_CLASSES, PERFORMANCE_CATEGORIES } from "../../lib/performanceTests";

export default function PerformanceOverviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Performans Ölçümleri</h1>
        <p className="text-sm text-muted">Bir kategori seç, testi seç, sporcunun ölçümünü kaydet.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {PERFORMANCE_CATEGORIES.map((cat) => {
          const cls = COLOR_CLASSES[cat.color];
          return (
            <Link
              key={cat.key}
              to={`/performance/${cat.key}`}
              className={`rounded-xl border-2 ${cls.border} bg-surface p-5 text-center transition-transform hover:-translate-y-0.5`}
            >
              <div className="mb-2 text-3xl">{cat.icon}</div>
              <div className="text-sm font-extrabold text-ink">{cat.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
