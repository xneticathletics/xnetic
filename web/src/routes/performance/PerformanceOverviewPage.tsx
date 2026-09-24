import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { inputClass } from "../../components/FormField";
import { COLOR_CLASSES, PERFORMANCE_CATEGORIES } from "../../lib/performanceTests";
import { listAllAthletes, type Athlete } from "../../lib/api/athletes";

// Mobildeki AthleticPerformanceScreen ile aynı giriş noktası: "Ölçümler"
// (sporcu seç → tüm ölçüm geçmişi), "Test Ekle", "Test Grupları" ve
// kategori kutucukları.
export default function PerformanceOverviewPage() {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [query, setQuery] = useState("");
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  const openPicker = async () => {
    setPickerOpen(true);
    setQuery("");
    if (athletes.length > 0) return;
    setLoadingAthletes(true);
    try {
      setAthletes(await listAllAthletes());
    } catch (e: any) {
      alert(e.message ?? "Sporcular yüklenemedi");
    } finally {
      setLoadingAthletes(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return athletes;
    return athletes.filter((a) => a.full_name.toLocaleLowerCase("tr").includes(q));
  }, [athletes, query]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Performans Ölçümleri</h1>
          <p className="text-sm text-muted">Bir kategori seç, testi seç, sporcunun ölçümünü kaydet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openPicker} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            📊 Ölçümler
          </button>
          <Link to="/performance/tests/new" className="rounded-lg border border-yellow px-4 py-2 text-sm font-bold text-yellow">
            + Test Ekle
          </Link>
          <Link to="/performance/groups" className="rounded-lg border border-yellow px-4 py-2 text-sm font-bold text-yellow">
            Test Grupları
          </Link>
        </div>
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

      {pickerOpen && (
        <Modal title="Sporcu Seç" onClose={() => setPickerOpen(false)}>
          <input
            className={`${inputClass} mb-3`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sporcu ara..."
            aria-label="Sporcu ara"
          />
          {loadingAthletes && <p className="text-xs text-muted">Yükleniyor…</p>}
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {!loadingAthletes && filtered.length === 0 && <p className="text-xs text-muted">Sporcu bulunamadı.</p>}
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/performance/athlete/${a.id}?name=${encodeURIComponent(a.full_name)}`)}
                className="flex w-full items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-left hover:bg-surface"
              >
                <span className="flex-1 text-sm text-ink">{a.full_name}</span>
                {a.groups?.name && <span className="text-xs text-muted">{a.groups.name}</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
