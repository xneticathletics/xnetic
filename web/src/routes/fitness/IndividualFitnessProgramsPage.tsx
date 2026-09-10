import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inputClass } from "../../components/FormField";
import { listAllAthletes, type Athlete } from "../../lib/api/athletes";

// Mobildeki IndividualFitnessProgramsHubScreen'in web karşılığı — bireysel
// program sporcu bazlı bir özellik olduğu için (genel bir liste değil)
// önce bir sporcu seçtiriyor, sonra o sporcunun programlarını gösteren
// sayfaya geçiyor. Web'de sadece salt okunur inceleme + silme var —
// programı sporcunun kendisi mobil uygulamadan yazıyor.
export default function IndividualFitnessProgramsPage() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAllAthletes()
      .then(setAthletes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return athletes.filter((a) => a.full_name.toLowerCase().includes(q)).slice(0, 20);
  }, [athletes, query]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Bireysel Programlar</h1>
      <p className="mb-6 text-sm text-muted">
        Sporcuların kendi yazdığı bireysel fitness programlarını incelemek için bir sporcu ara.
      </p>

      <input
        className={`${inputClass} max-w-sm`}
        placeholder="Sporcu ara…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="mt-4 text-sm font-semibold text-coral">{error}</p>}
      {loading && <p className="mt-4 text-sm text-muted">Yükleniyor…</p>}

      {query.trim() && (
        <div className="mt-4 max-w-sm space-y-2">
          {filtered.length === 0 && !loading && <p className="text-sm text-muted">Eşleşen sporcu bulunamadı.</p>}
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/fitness/individual/${a.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left hover:border-violet"
            >
              {a.photo_url ? (
                <img src={a.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-xs font-bold">
                  {a.full_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-ink">{a.full_name}</p>
                {a.groups && <p className="text-xs text-muted">{a.groups.name} · {a.groups.branch}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
