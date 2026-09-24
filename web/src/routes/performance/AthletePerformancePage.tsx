import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { listAllMeasurementsForAthlete, type PerformanceMeasurement } from "../../lib/api/performanceMeasurements";
import { getCustomTestsByIds, resolveLowerIsBetter, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";
import { COLOR_CLASSES, getPerformanceCategory } from "../../lib/performanceTests";

const CUSTOM_PREFIX = "custom:";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Son iki ölçüm arasındaki değişim; "gelişme mi" kararı testin kendi
// lower_is_better alanına göre (mobildeki computeTrend ile aynı).
type Trend = { pct: number; dir: "up" | "down"; improved: boolean };
function computeTrend(items: PerformanceMeasurement[], lowerIsBetter: boolean): Trend | null {
  if (items.length < 2) return null;
  const latest = items[0].value;
  const previous = items[1].value;
  if (previous === 0) return null;
  const pct = ((latest - previous) / Math.abs(previous)) * 100;
  if (pct === 0) return null;
  const dir: "up" | "down" = pct > 0 ? "up" : "down";
  return { pct: Math.round(Math.abs(pct) * 10) / 10, dir, improved: lowerIsBetter ? dir === "down" : dir === "up" };
}

type Group = {
  testKey: string;
  testId: string;
  items: PerformanceMeasurement[];
  name: string;
  unit: string;
  lowerIsBetter: boolean;
  categoryKey: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: "yellow" | "teal" | "coral" | "violet";
};

// Mobildeki AthletePerformanceViewScreen'in web karşılığı: bir sporcunun
// TÜM testlerdeki ölçüm geçmişi, test bazında gruplanmış.
export default function AthletePerformancePage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [params] = useSearchParams();
  const athleteName = params.get("name") ?? "Sporcu";

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const measurements = await listAllMeasurementsForAthlete(athleteId);
        const byKey = new Map<string, PerformanceMeasurement[]>();
        measurements.forEach((m) => {
          const list = byKey.get(m.test_key) ?? [];
          list.push(m);
          byKey.set(m.test_key, list);
        });
        const customIds = Array.from(byKey.keys())
          .filter((k) => k.startsWith(CUSTOM_PREFIX))
          .map((k) => k.slice(CUSTOM_PREFIX.length));
        const tests = await getCustomTestsByIds(customIds);
        const byId = new Map<string, CustomPerformanceTest>(tests.map((t) => [t.id, t]));

        const resolved: Group[] = [];
        byKey.forEach((items, testKey) => {
          if (!testKey.startsWith(CUSTOM_PREFIX)) return;
          const test = byId.get(testKey.slice(CUSTOM_PREFIX.length));
          if (!test) return;
          const category = getPerformanceCategory(test.category);
          if (!category) return;
          resolved.push({
            testKey,
            testId: test.id,
            items,
            name: test.name,
            unit: test.unit,
            lowerIsBetter: resolveLowerIsBetter(test),
            categoryKey: category.key,
            categoryLabel: category.label,
            categoryIcon: category.icon,
            categoryColor: category.color,
          });
        });
        resolved.sort(
          (a, b) => new Date(b.items[0].measured_at).getTime() - new Date(a.items[0].measured_at).getTime()
        );
        if (!cancelled) setGroups(resolved);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Ölçümler yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [athleteId]);

  const summary = useMemo(() => (groups.length > 0 ? `${groups.length} test takip ediliyor` : null), [groups]);

  return (
    <div>
      <Link to="/performance" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Performans Ölçümleri
      </Link>
      <h1 className="mb-1 text-xl font-bold text-ink">{athleteName} — Ölçümler</h1>
      {summary && <p className="mb-6 text-sm text-muted">{summary}</p>}

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}
      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {!loading && groups.length === 0 && !error && (
        <p className="text-sm text-muted">Henüz kaydedilmiş bir ölçüm yok.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => {
          const trend = computeTrend(g.items, g.lowerIsBetter);
          const cls = COLOR_CLASSES[g.categoryColor];
          const recent = g.items.slice(0, 6);
          return (
            <Link
              key={g.testKey}
              to={`/performance/${g.categoryKey}/custom:${g.testId}`}
              className={`rounded-xl border-2 ${cls.border} bg-surface p-4 transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">{g.categoryIcon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink">{g.name}</div>
                  <div className="text-xs text-muted">{g.categoryLabel}</div>
                </div>
                {trend && (
                  <span className={`text-xs font-bold ${trend.improved ? "text-teal" : "text-coral"}`}>
                    {trend.dir === "up" ? "▲" : "▼"} %{trend.pct}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-2xl font-extrabold ${cls.text}`}>{g.items[0].value}</span>
                <span className="text-xs text-muted">{g.unit}</span>
                <span className="ml-auto text-xs text-muted">{formatDate(g.items[0].measured_at)}</span>
              </div>

              <div className="mt-3 space-y-1">
                {recent.slice(1).map((m) => (
                  <div key={m.id} className="flex justify-between text-xs text-muted">
                    <span>{formatDate(m.measured_at)}</span>
                    <span>
                      {m.value} {g.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
