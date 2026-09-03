import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProgram, listProgramItems, deleteProgram, listCompletionsForProgram,
  type FitnessProgram, type FitnessProgramItem, type FitnessProgramCompletion,
} from "../../lib/api/fitnessPrograms";

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
            {completions.map((c) => (
              <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{c.athletes?.full_name ?? "Sporcu"}</span>
                  <span className="text-xs text-muted">{formatDateTime(c.completed_at)}</span>
                </div>
                {c.note && <p className="mt-1 text-xs italic text-muted">{c.note}</p>}
              </div>
            ))}
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
