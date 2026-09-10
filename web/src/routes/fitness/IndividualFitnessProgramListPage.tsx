import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAthlete, type Athlete } from "../../lib/api/athletes";
import { listIndividualPrograms, type IndividualFitnessProgram } from "../../lib/api/individualFitnessPrograms";

export default function IndividualFitnessProgramListPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [programs, setPrograms] = useState<IndividualFitnessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    setLoading(true);
    Promise.all([getAthlete(athleteId), listIndividualPrograms(athleteId)])
      .then(([a, p]) => {
        setAthlete(a);
        setPrograms(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [athleteId]);

  return (
    <div>
      <Link to="/fitness/individual" className="mb-4 inline-block text-xs font-bold text-teal hover:underline">
        ← Başka sporcu ara
      </Link>

      <div className="mb-6 flex items-center gap-3">
        {athlete?.photo_url ? (
          <img src={athlete.photo_url} className="h-10 w-10 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-line text-sm font-bold">
            {athlete?.full_name.slice(0, 1).toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-ink">{athlete?.full_name ?? "…"}</h1>
          {athlete?.groups && <p className="text-xs text-muted">{athlete.groups.name} · {athlete.groups.branch}</p>}
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}

      {!loading && !error && programs.length === 0 && (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="mb-1 text-2xl">📝</p>
          <p className="mb-1 text-sm font-bold text-violet">Henüz Bir Program Yok</p>
          <p className="text-xs text-muted">Bu sporcu henüz kendi bireysel programını oluşturmadı.</p>
        </div>
      )}

      <div className="space-y-2">
        {programs.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/fitness/individual/${athleteId}/${p.id}`)}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-surface p-4 text-left hover:border-violet"
          >
            <span className="text-sm font-bold text-ink">{p.name}</span>
            <span className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString("tr-TR")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
