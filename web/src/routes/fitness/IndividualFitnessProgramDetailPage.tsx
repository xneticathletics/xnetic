import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getIndividualProgram, listIndividualProgramItems, deleteIndividualProgram,
  type IndividualFitnessProgram, type IndividualFitnessProgramItem,
} from "../../lib/api/individualFitnessPrograms";
import { listAllMeasurementsForAthlete, type FitnessMeasurement } from "../../lib/api/fitnessMeasurements";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function IndividualFitnessProgramDetailPage() {
  const { athleteId, programId } = useParams<{ athleteId: string; programId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === "club_admin";

  const [program, setProgram] = useState<IndividualFitnessProgram | null>(null);
  const [items, setItems] = useState<IndividualFitnessProgramItem[]>([]);
  const [history, setHistory] = useState<Record<string, FitnessMeasurement[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!programId || !athleteId) return;
    setLoading(true);
    Promise.all([getIndividualProgram(programId), listIndividualProgramItems(programId)])
      .then(async ([p, i]) => {
        setProgram(p);
        setItems(i);
        // Sporcunun TÜM ölçümlerini TEK sorguda çekip programdaki
        // hareketlere göre burada grupluyoruz — her hareket için ayrı
        // sorgu (N+1) yerine tek seferde çekmek daha ölçeklenebilir.
        const all = await listAllMeasurementsForAthlete(athleteId);
        const byExerciseKey = new Map<string, FitnessMeasurement[]>();
        all.forEach((m) => {
          if (!byExerciseKey.has(m.exercise_key)) byExerciseKey.set(m.exercise_key, []);
          byExerciseKey.get(m.exercise_key)!.push(m);
        });
        setHistory(Object.fromEntries(i.map((item) => [item.id, byExerciseKey.get(item.exercise_key) ?? []])));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [programId, athleteId]);

  const handleDelete = async () => {
    if (!programId || !athleteId) return;
    if (!confirm(`"${program?.name}" bireysel programını silmek istediğine emin misin?`)) return;
    setDeleting(true);
    try {
      await deleteIndividualProgram(programId);
      navigate(`/fitness/individual/${athleteId}`);
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (error) return <p className="text-sm font-semibold text-coral">{error}</p>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(`/fitness/individual/${athleteId}`)}
        className="mb-4 text-xs font-bold text-teal hover:underline"
      >
        ← Programlara Dön
      </button>

      <h1 className="text-xl font-bold text-ink">{program?.name}</h1>
      {program && <p className="mb-6 text-xs text-muted">{formatDate(program.created_at)}</p>}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-bold text-ink">
              {item.exercise_name} <span className="text-xs font-semibold text-muted">(hedef {item.sets}×{item.reps})</span>
            </p>

            {(history[item.id]?.length ?? 0) > 0 ? (
              <div className="space-y-1.5 border-t border-line pt-3">
                {history[item.id].slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">
                      {m.weight_kg != null ? `${m.weight_kg} kg` : "Vücut ağırlığı"} × {m.reps} tekrar
                    </span>
                    <span className="text-muted">{formatDate(m.measured_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-muted">Bu hareket için henüz kayıt yok.</p>
            )}
          </div>
        ))}
      </div>

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-8 w-full rounded-lg border border-coral py-3 text-sm font-bold text-coral hover:bg-coral/10 disabled:opacity-60"
        >
          {deleting ? "Siliniyor…" : "Programı Sil"}
        </button>
      )}
    </div>
  );
}
