import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField, { inputClass } from "../../components/FormField";
import { listAllAthletes, type Athlete } from "../../lib/api/athletes";
import { listAllTests, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";
import { getPerformanceCategory } from "../../lib/performanceTests";
import { createTestGroup } from "../../lib/api/performanceTestGroups";

// Mobildeki TestGroupFormScreen'in web karşılığı: grup adı + sporcu seçimi
// + test seçimi. Web'de ekran geniş olduğu için iki liste yan yana ve
// aramalı (mobildeki ayrı seçim modallarının karşılığı).
export default function TestGroupFormPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [athleteQuery, setAthleteQuery] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listAllAthletes(), listAllTests()])
      .then(([a, t]) => {
        setAthletes(a);
        setTests(t);
      })
      .catch((e) => setError(e.message ?? "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const filteredAthletes = useMemo(() => {
    const q = athleteQuery.trim().toLocaleLowerCase("tr");
    if (!q) return athletes;
    return athletes.filter((a) => a.full_name.toLocaleLowerCase("tr").includes(q));
  }, [athletes, athleteQuery]);

  const filteredTests = useMemo(() => {
    const q = testQuery.trim().toLocaleLowerCase("tr");
    if (!q) return tests;
    return tests.filter((t) => t.name.toLocaleLowerCase("tr").includes(q));
  }, [tests, testQuery]);

  const toggle = (set: Set<string>, id: string, apply: (next: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) return setError("Grubun adını girmelisin.");
    if (selectedAthletes.size === 0) return setError("En az bir sporcu seçmelisin.");
    if (selectedTests.size === 0) return setError("En az bir test seçmelisin.");
    setSaving(true);
    setError(null);
    try {
      const group = await createTestGroup({
        name: name.trim(),
        athleteIds: Array.from(selectedAthletes),
        testIds: Array.from(selectedTests),
      });
      navigate(`/performance/groups/${group.id}`);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      <Link to="/performance/groups" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Test Grupları
      </Link>
      <h1 className="mb-6 text-xl font-bold text-ink">Yeni Test Grubu</h1>

      <div className="max-w-md">
        <FormField label="Grup Adı *">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. U14 Sezon Başı Testleri" />
        </FormField>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Sporcular</h2>
            <span className="text-xs text-muted">{selectedAthletes.size} seçili</span>
          </div>
          <input
            className={`${inputClass} mb-3`}
            value={athleteQuery}
            onChange={(e) => setAthleteQuery(e.target.value)}
            placeholder="Sporcu ara..."
            aria-label="Sporcu ara"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredAthletes.length === 0 && <p className="text-xs text-muted">Sporcu bulunamadı.</p>}
            {filteredAthletes.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedAthletes.has(a.id)}
                  onChange={() => toggle(selectedAthletes, a.id, setSelectedAthletes)}
                />
                <span className="flex-1 text-sm text-ink">{a.full_name}</span>
                {a.groups?.name && <span className="text-xs text-muted">{a.groups.name}</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Testler</h2>
            <span className="text-xs text-muted">{selectedTests.size} seçili</span>
          </div>
          <input
            className={`${inputClass} mb-3`}
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Test ara..."
            aria-label="Test ara"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredTests.length === 0 && <p className="text-xs text-muted">Test bulunamadı.</p>}
            {filteredTests.map((t) => {
              const cat = getPerformanceCategory(t.category);
              return (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedTests.has(t.id)}
                    onChange={() => toggle(selectedTests, t.id, setSelectedTests)}
                  />
                  <span className="flex-1 text-sm text-ink">
                    {cat ? `${cat.icon} ` : ""}
                    {t.name}
                  </span>
                  <span className="text-xs text-muted">{t.unit}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-yellow px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Test Grubunu Oluştur"}
      </button>
    </div>
  );
}
