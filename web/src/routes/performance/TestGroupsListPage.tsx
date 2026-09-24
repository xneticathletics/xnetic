import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTestGroups, deleteTestGroup, type TestGroupSummary } from "../../lib/api/performanceTestGroups";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Mobildeki TestGroupsListScreen'in web karşılığı.
export default function TestGroupsListPage() {
  const [groups, setGroups] = useState<TestGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listTestGroups()
      .then(setGroups)
      .catch((e) => setError(e.message ?? "Test grupları yüklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (group: TestGroupSummary) => {
    if (!confirm(`"${group.name}" kalıcı olarak silinecek. Emin misin?`)) return;
    try {
      await deleteTestGroup(group.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  return (
    <div>
      <Link to="/performance" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Performans Ölçümleri
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Test Grupları</h1>
          <p className="text-sm text-muted">Bir grup sporcuya aynı testleri uygula, ölçümleri tek ekrandan gir.</p>
        </div>
        <Link to="/performance/groups/new" className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Yeni Test Grubu
        </Link>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}
      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {!loading && groups.length === 0 && <p className="text-sm text-muted">Henüz test grubu yok.</p>}

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
            <Link to={`/performance/groups/${g.id}`} className="flex-1">
              <div className="text-sm font-bold text-ink">{g.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {g.athlete_count} sporcu · {g.test_count} test · {formatDate(g.created_at)}
              </div>
            </Link>
            <button
              onClick={() => handleDelete(g)}
              className="rounded-lg border border-coral px-3 py-1.5 text-xs font-bold text-coral"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
