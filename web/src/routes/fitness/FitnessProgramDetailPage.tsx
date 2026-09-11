import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProgram, listProgramItems, deleteProgram, listCompletionsForProgram,
  type FitnessProgram, type FitnessProgramItem, type FitnessProgramCompletion,
} from "../../lib/api/fitnessPrograms";
import { listMeasurementsNearCompletion, type FitnessMeasurement } from "../../lib/api/fitnessMeasurements";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Mobildeki FitnessProgramDetailScreen.tsx'in web karşılığı.
export default function FitnessProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [items, setItems] = useState<FitnessProgramItem[]>([]);
  const [completions, setCompletions] = useState<FitnessProgramCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, FitnessMeasurement[]>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const groupedDetailsByCompletion = useMemo(() => {
    const result: Record<string, Map<string, FitnessMeasurement[]>> = {};
    for (const [cid, rows] of Object.entries(details)) {
      const byExercise = new Map<string, FitnessMeasurement[]>();
      rows.forEach((m) => {
        if (!byExercise.has(m.exercise_key)) byExercise.set(m.exercise_key, []);
        byExercise.get(m.exercise_key)!.push(m);
      });
      result[cid] = byExercise;
    }
    return result;
  }, [details]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getProgram(id), listProgramItems(id), listCompletionsForProgram(id)])
      .then(([p, i, c]) => {
        if (cancelled) return;
        setProgram(p);
        setItems(i);
        setCompletions(c);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleToggle = async (c: FitnessProgramCompletion) => {
    if (expandedId === c.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(c.id);
    if (details[c.id]) return;
    setLoadingDetailId(c.id);
    try {
      const measurements = await listMeasurementsNearCompletion(c.athlete_id, c.completed_at);
      const itemKeys = new Set(items.map((i) => i.exercise_key));
      setDetails((prev) => ({ ...prev, [c.id]: measurements.filter((m) => itemKeys.has(m.exercise_key)) }));
    } catch {
      setDetails((prev) => ({ ...prev, [c.id]: [] }));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Bu programı silmek istediğine emin misin?")) return;
    try {
      await deleteProgram(id);
      navigate("/fitness/programs");
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  return (
    <div>
      <Link to="/fitness/programs" className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ Programlar
      </Link>

      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}

      {!loading && program && (
        <>
          <h1 className="mb-1 text-xl font-bold text-ink">{program.name}</h1>
          {program.groups && <p className="mb-1 text-sm font-semibold text-violet">{program.groups.name} · {program.groups.branch}</p>}
          {program.fitness_groups && (
            <p className="mb-1 text-sm font-semibold text-violet">🎯 {program.fitness_groups.name} · {program.fitness_groups.branch}</p>
          )}
          <p className="mb-6 text-xs text-muted">{new Date(program.created_at).toLocaleDateString("tr-TR")}</p>

          <h2 className="mb-3 text-sm font-bold text-ink">Hareketler</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-surface p-4">
                <span className="text-sm font-semibold text-ink">{item.exercise_name}</span>
                <span className="text-xs text-muted">{item.sets} set × {item.reps} tekrar</span>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted">Bu programda hareket yok.</p>}
          </div>

          <h2 className="mb-3 mt-8 text-sm font-bold text-ink">Tamamlayanlar</h2>
          <div className="space-y-2">
            {completions.map((c) => {
              const expanded = expandedId === c.id;
              const rows = details[c.id] ?? [];
              const byExercise = groupedDetailsByCompletion[c.id] ?? new Map<string, FitnessMeasurement[]>();
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggle(c)}
                  className="w-full rounded-lg border border-line bg-surface p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{c.athletes?.full_name ?? "Sporcu"}</span>
                    <span className="text-xs text-muted">
                      {formatDateTime(c.completed_at)}
                      {c.difficulty != null ? ` · Zorluk: ${c.difficulty}/10` : ""}
                      {c.duration_minutes != null ? ` · ${c.duration_minutes} dk` : ""}
                      <span className="ml-2">{expanded ? "▲" : "▼"}</span>
                    </span>
                  </div>
                  {c.note && <p className="mt-1 text-xs italic text-muted">{c.note}</p>}

                  {expanded && (
                    <div className="mt-3 border-t border-line pt-3">
                      {loadingDetailId === c.id ? (
                        <p className="text-xs text-muted">Yükleniyor…</p>
                      ) : rows.length === 0 ? (
                        <p className="text-xs italic text-muted">Set bazlı ağırlık/tekrar girişi yok.</p>
                      ) : (
                        items
                          .filter((item) => byExercise.has(item.exercise_key))
                          .map((item) => (
                            <div key={item.id} className="mb-2">
                              <p className="text-xs font-extrabold text-violet">{item.exercise_name}</p>
                              {byExercise.get(item.exercise_key)!.map((m, i) => (
                                <p key={m.id} className="ml-2 text-xs text-ink">
                                  Set {i + 1}: {m.weight_kg != null ? `${m.weight_kg} kg` : "Vücut ağırlığı"} × {m.reps} tekrar
                                </p>
                              ))}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </button>
              );
            })}
            {completions.length === 0 && (
              <p className="text-sm text-muted">Bu programı henüz kimse tamamladı olarak işaretlemedi.</p>
            )}
          </div>

          <button
            onClick={handleDelete}
            className="mt-8 w-full rounded-lg border border-coral py-3 text-sm font-bold text-coral hover:bg-coral/10"
          >
            Programı Sil
          </button>
        </>
      )}
    </div>
  );
}
